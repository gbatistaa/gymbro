package com.gbatistadev.gymbro.workout_session;

import com.gbatistadev.gymbro.workout_logs.WorkoutLog;
import com.gbatistadev.gymbro.workout_session.dto.*;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface WorkoutSessionMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "endedAt", ignore = true)
    @Mapping(target = "totalVolume", ignore = true)
    @Mapping(target = "playlist", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "notes", ignore = true)
    @Mapping(target = "version", ignore = true)
    WorkoutSession toEntity(StartSessionRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "workoutSession", ignore = true)
    @Mapping(target = "exercise", ignore = true)
    @Mapping(target = "isPr", ignore = true)
    WorkoutLog toEntity(AddLogRequest request);

    @Mapping(target = "playlistId",
        expression = "java(session.getPlaylist() != null ? session.getPlaylist().getId() : null)")
    SessionDto toDto(WorkoutSession session);

    @Mapping(target = "exerciseId", source = "exercise.id")
    @Mapping(target = "exerciseName", source = "exercise.name")
    LogDto toDto(WorkoutLog log);

    default SessionDetailDto toDetail(WorkoutSession session, List<ExerciseLogsDto> exercises) {
        return new SessionDetailDto(
            session.getId(),
            session.getPlaylist() != null ? session.getPlaylist().getId() : null,
            session.getStatus(),
            session.getStartedAt(),
            session.getEndedAt(),
            session.getTotalVolume(),
            session.getNotes(),
            exercises);
    }

    default List<ExerciseLogsDto> toExerciseLogs(List<WorkoutLog> logs) {
        Map<UUID, List<WorkoutLog>> byExercise = logs.stream()
            .collect(Collectors.groupingBy(
                log -> log.getExercise().getId(),
                LinkedHashMap::new,
                Collectors.toList()));

        return byExercise.values().stream()
            .map(group -> new ExerciseLogsDto(
                group.getFirst().getExercise().getId(),
                group.getFirst().getExercise().getName(),
                group.stream().map(this::toDto).toList()))
            .toList();
    }
}
