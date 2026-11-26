package com.gbatistadev.gymbro.playlist;

import com.gbatistadev.gymbro.common.security.CurrentUser;
import com.gbatistadev.gymbro.errors.exceptions.ConflictException;
import com.gbatistadev.gymbro.errors.exceptions.NotFoundException;
import com.gbatistadev.gymbro.exercise.Exercise;
import com.gbatistadev.gymbro.exercise.ExerciseRepository;
import com.gbatistadev.gymbro.playlist.dto.*;
import com.gbatistadev.gymbro.playlist_exercises.PlaylistExercise;
import com.gbatistadev.gymbro.playlist_exercises.PlaylistExerciseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlaylistService {
    private final PlaylistRepository playlists;
    private final PlaylistExerciseRepository items;
    private final ExerciseRepository exercises;
    private final PlaylistMapper mapper;
    private final CurrentUser currentUser;

    @Transactional(readOnly = true)
    public List<PlaylistSummaryDto> list() {
        List<PlaylistSummaryRow> rows = playlists.findSummariesByUserId(currentUser.id());
        if (rows.isEmpty()) {
            return List.of();
        }

        Map<UUID, List<PlaylistExerciseDto>> itemsByPlaylist = items
            .findDetailByPlaylistIdIn(rows.stream().map(row -> row.id()).toList())
            .stream()
            .collect(Collectors.groupingBy(
                item -> item.getPlaylist().getId(),
                Collectors.mapping(mapper::toDto, Collectors.toList())));

        return rows.stream()
            .map(row -> new PlaylistSummaryDto(
                row.id(),
                row.name(),
                row.description(),
                row.exerciseCount(),
                row.lastPerformedAt(),
                itemsByPlaylist.getOrDefault(row.id(), List.of())))
            .toList();
    }

    @Transactional
    public PlaylistDto create(CreatePlaylistRequest request) {
        Playlist playlist = mapper.toEntity(request);
        playlist.setUserId(currentUser.id());
        Playlist saved = playlists.save(playlist);

        if (request.exercises() != null) {
            request.exercises().forEach(exercise -> appendExercise(saved, exercise));
        }

        return mapper.toDto(saved);
    }

    @Transactional(readOnly = true)
    public PlaylistDetailDto detail(UUID id) {
        Playlist playlist = load(id);
        return mapper.toDetail(playlist, itemDtos(id));
    }

    @Transactional
    public PlaylistDto update(UUID id, UpdatePlaylistRequest request) {
        Playlist playlist = load(id);
        mapper.updateEntity(request, playlist);
        return mapper.toDto(playlists.save(playlist));
    }

    @Transactional
    public PlaylistDto clone(UUID id) {
        Playlist source = load(id);
        Playlist copy = mapper.toCopy(source);

        copy.setName(source.getName() + " (cópia)");
        copy.setUserId(currentUser.id());

        playlists.save(copy);

        for (PlaylistExercise sourceItem : items.findByPlaylistIdOrderByOrderIndexAsc(id)) {
            PlaylistExercise clone = mapper.toCopy(sourceItem);
            clone.setPlaylist(copy);
            items.save(clone);
        }

        return mapper.toDto(copy);
    }

    @Transactional
    public void delete(UUID id) {
        playlists.delete(load(id));
    }

    @Transactional
    public PlaylistExerciseDto addExercise(UUID id, AddPlaylistExerciseRequest request) {
        return mapper.toDto(appendExercise(load(id), request));
    }


    private PlaylistExercise appendExercise(Playlist playlist, AddPlaylistExerciseRequest request) {
        Exercise exercise = exercises.findByIdForUser(request.exerciseId(), currentUser.id())
            .orElseThrow(() -> new NotFoundException("Exercise not found: " + request.exerciseId()));

        if (Boolean.TRUE.equals(exercise.getIsArchived())) {
            throw new ConflictException("Exercise is archived");
        }
        validateReps(request.targetRepsMin(), request.targetRepsMax());

        PlaylistExercise item = mapper.toEntity(request);
        item.setPlaylist(playlist);
        item.setExercise(exercise);
        item.setOrderIndex(items.maxOrderIndex(playlist.getId()) + 1);

        return items.saveAndFlush(item);
    }

    @Transactional
    public PlaylistExerciseDto updateExercise(
        UUID id, UUID itemId, UpdatePlaylistExerciseRequest request
    ) {
        load(id);
        PlaylistExercise item = items.findByIdAndPlaylistId(itemId, id)
            .orElseThrow(() -> new NotFoundException("Playlist exercise not found: " + itemId));

        validateReps(
            request.targetRepsMin() != null ? request.targetRepsMin() : item.getTargetRepsMin(),
            request.targetRepsMax() != null ? request.targetRepsMax() : item.getTargetRepsMax());

        mapper.updateEntity(request, item);
        return mapper.toDto(items.save(item));
    }

    @Transactional
    public void removeExercise(UUID id, UUID itemId) {
        load(id);
        PlaylistExercise item = items.findByIdAndPlaylistId(itemId, id)
            .orElseThrow(() -> new NotFoundException("Playlist exercise not found: " + itemId));

        items.delete(item);
        items.flush();
        reindex(id);
    }

    @Transactional
    public PlaylistDetailDto reorder(UUID id, ReorderRequest request) {
        Playlist playlist = load(id);
        List<PlaylistExercise> current = items.findByPlaylistIdOrderByOrderIndexAsc(id);

        Map<UUID, PlaylistExercise> byId = current.stream()
            .collect(Collectors.toMap(item -> item.getId(), item -> item));
        Set<Integer> indices = new HashSet<>();

        if (request.items().size() != current.size()) {
            throw new ConflictException("Reorder must include every playlist exercise");
        }
        for (ReorderRequest.ReorderItem requested : request.items()) {
            PlaylistExercise item = byId.get(requested.playlistExerciseId());
            if (item == null) {
                throw new NotFoundException(
                    "Playlist exercise not found: " + requested.playlistExerciseId());
            }
            if (!indices.add(requested.orderIndex())) {
                throw new ConflictException("orderIndex values must be unique");
            }
            item.setOrderIndex(requested.orderIndex());
        }
        for (int i = 0; i < current.size(); i++) {
            if (!indices.contains(i)) {
                throw new ConflictException("orderIndex values must be contiguous from 0");
            }
        }

        items.saveAll(current);
        return mapper.toDetail(playlist, itemDtos(id));
    }

    private void reindex(UUID id) {
        List<PlaylistExercise> remaining = items.findByPlaylistIdOrderByOrderIndexAsc(id);
        for (int i = 0; i < remaining.size(); i++) {
            remaining.get(i).setOrderIndex(i);
        }
        items.saveAll(remaining);
    }

    private List<PlaylistExerciseDto> itemDtos(UUID id) {
        return items.findDetailByPlaylistId(id).stream().map(mapper::toDto).toList();
    }

    private void validateReps(Integer min, Integer max) {
        if (min != null && max != null && min > max) {
            throw new ConflictException("targetRepsMin cannot be greater than targetRepsMax");
        }
    }

    private Playlist load(UUID id) {
        return playlists.findByIdAndUserId(id, currentUser.id())
            .orElseThrow(() -> new NotFoundException("Playlist not found: " + id));
    }

}
