package com.gbatistadev.gymbro.playlist;

import com.gbatistadev.gymbro.playlist.dto.*;
import com.gbatistadev.gymbro.playlist_exercises.PlaylistExercise;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

import java.util.List;

@Mapper(componentModel = "spring")
public interface PlaylistMapper {

    PlaylistDto toDto(Playlist playlist);

    @Mapping(target = "exerciseId", source = "exercise.id")
    @Mapping(target = "exerciseName", source = "exercise.name")
    PlaylistExerciseDto toDto(PlaylistExercise playlistExercise);

    default PlaylistDetailDto toDetail(Playlist playlist, List<PlaylistExerciseDto> exercises) {
        return new PlaylistDetailDto(
            playlist.getId(),
            playlist.getName(),
            playlist.getDescription(),
            playlist.getArchivedAt(),
            exercises);
    }

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "archivedAt", ignore = true)
    Playlist toEntity(CreatePlaylistRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "archivedAt", ignore = true)
    void updateEntity(UpdatePlaylistRequest request, @MappingTarget Playlist playlist);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "archivedAt", ignore = true)
    Playlist toCopy(Playlist source);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "playlist", ignore = true)
    @Mapping(target = "exercise", ignore = true)
    @Mapping(target = "orderIndex", ignore = true)
    PlaylistExercise toEntity(AddPlaylistExerciseRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "playlist", ignore = true)
    PlaylistExercise toCopy(PlaylistExercise source);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "playlist", ignore = true)
    @Mapping(target = "exercise", ignore = true)
    @Mapping(target = "orderIndex", ignore = true)
    void updateEntity(UpdatePlaylistExerciseRequest request, @MappingTarget PlaylistExercise playlistExercise);
}
