package com.gbatistadev.gymbro.playlist;

import com.gbatistadev.gymbro.common.security.CurrentUser;
import com.gbatistadev.gymbro.errors.exceptions.ConflictException;
import com.gbatistadev.gymbro.errors.exceptions.NotFoundException;
import com.gbatistadev.gymbro.exercise.Exercise;
import com.gbatistadev.gymbro.exercise.ExerciseRepository;
import com.gbatistadev.gymbro.playlist.dto.*;
import com.gbatistadev.gymbro.playlist_exercises.PlaylistExercise;
import com.gbatistadev.gymbro.playlist_exercises.PlaylistExerciseRepository;
import com.gbatistadev.gymbro.workout_session.SessionStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
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
    public List<PlaylistSummaryDto> list(boolean includeArchived) {
        return playlists.findSummariesByUserId(
            currentUser.id(), includeArchived, SessionStatus.FINISHED);
    }

    @Transactional
    public PlaylistDto create(CreatePlaylistRequest request) {
        Playlist playlist = mapper.toEntity(request);
        playlist.setUserId(currentUser.id());
        return mapper.toDto(playlists.save(playlist));
    }

    @Transactional(readOnly = true)
    public PlaylistDetailDto detail(UUID id) {
        Playlist playlist = load(id);
        return mapper.toDetail(playlist, itemDtos(id));
    }

    @Transactional
    public PlaylistDto update(UUID id, UpdatePlaylistRequest request) {
        Playlist playlist = loadActive(id);
        mapper.updateEntity(request, playlist);
        return mapper.toDto(playlists.save(playlist));
    }

    @Transactional
    public PlaylistDto clone(UUID id) {
        Playlist source = loadActive(id);
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
    public PlaylistDto archive(UUID id) {
        Playlist playlist = load(id);
        if (playlist.getArchivedAt() == null) {
            playlist.setArchivedAt(Instant.now());
            playlists.save(playlist);
        }
        return mapper.toDto(playlist);
    }

    @Transactional
    public PlaylistExerciseDto addExercise(UUID id, AddPlaylistExerciseRequest request) {
        Playlist playlist = loadActive(id);
        Exercise exercise = exercises.findByIdForUser(request.exerciseId(), currentUser.id())
            .orElseThrow(() -> new NotFoundException("Exercise not found: " + request.exerciseId()));

        if (Boolean.TRUE.equals(exercise.getIsArchived())) {
            throw new ConflictException("Exercise is archived");
        }
        validateReps(request.targetRepsMin(), request.targetRepsMax());

        PlaylistExercise item = mapper.toEntity(request);
        item.setPlaylist(playlist);
        item.setExercise(exercise);
        item.setOrderIndex(items.maxOrderIndex(id) + 1);

        return mapper.toDto(items.save(item));
    }

    @Transactional
    public PlaylistExerciseDto updateExercise(
        UUID id, UUID itemId, UpdatePlaylistExerciseRequest request
    ) {
        loadActive(id);
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
        loadActive(id);
        PlaylistExercise item = items.findByIdAndPlaylistId(itemId, id)
            .orElseThrow(() -> new NotFoundException("Playlist exercise not found: " + itemId));

        items.delete(item);
        items.flush();
        reindex(id);
    }

    @Transactional
    public PlaylistDetailDto reorder(UUID id, ReorderRequest request) {
        Playlist playlist = loadActive(id);
        List<PlaylistExercise> current = items.findByPlaylistIdOrderByOrderIndexAsc(id);

        Map<UUID, PlaylistExercise> byId = current.stream()
            .collect(Collectors.toMap(PlaylistExercise::getId, item -> item));
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

    private Playlist loadActive(UUID id) {
        Playlist playlist = load(id);
        if (playlist.getArchivedAt() != null) {
            throw new ConflictException("Playlist is archived");
        }
        return playlist;
    }
}
