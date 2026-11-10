package com.gbatistadev.gymbro.analytics;

import com.gbatistadev.gymbro.analytics.dto.NextTargetDto;
import com.gbatistadev.gymbro.common.security.CurrentUser;
import com.gbatistadev.gymbro.errors.exceptions.NotFoundException;
import com.gbatistadev.gymbro.exercise.Exercise;
import com.gbatistadev.gymbro.playlist.PlaylistRepository;
import com.gbatistadev.gymbro.playlist_exercises.PlaylistExercise;
import com.gbatistadev.gymbro.playlist_exercises.PlaylistExerciseRepository;
import com.gbatistadev.gymbro.workout_logs.WorkoutLog;
import com.gbatistadev.gymbro.workout_logs.WorkoutLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProgressionService {
    private static final double DEFAULT_INCREMENT_KG = 2.5;

    private final PlaylistRepository playlists;
    private final PlaylistExerciseRepository items;
    private final WorkoutLogRepository logs;
    private final CurrentUser currentUser;

    @Transactional(readOnly = true)
    public List<NextTargetDto> nextTargets(UUID playlistId) {
        UUID userId = currentUser.id();
        playlists.findByIdAndUserId(playlistId, userId)
            .orElseThrow(() -> new NotFoundException("Playlist not found: " + playlistId));

        List<PlaylistExercise> playlistItems = items.findDetailByPlaylistId(playlistId);
        if (playlistItems.isEmpty()) {
            return List.of();
        }

        Map<UUID, UUID> latestSessionByExercise = logs
            .findLatestFinishedSessionPerExercise(
                userId, playlistItems.stream().map(item -> item.getExercise().getId()).toList())
            .stream()
            .collect(Collectors.toMap(
                WorkoutLogRepository.LatestExerciseSession::getExerciseId,
                WorkoutLogRepository.LatestExerciseSession::getSessionId));

        Map<UUID, List<WorkoutLog>> latestSets = latestSessionByExercise.isEmpty()
            ? Map.of()
            : latestLogsByExercise(latestSessionByExercise);

        return playlistItems.stream()
            .map(item -> target(item, latestSets.getOrDefault(item.getExercise().getId(), List.of())))
            .toList();
    }

    private Map<UUID, List<WorkoutLog>> latestLogsByExercise(Map<UUID, UUID> latestSessionByExercise) {
        Map<UUID, List<WorkoutLog>> result = new HashMap<>();
        for (WorkoutLog log : logs.findBySessionIdsWithExercise(
            new HashSet<>(latestSessionByExercise.values()))) {
            UUID exerciseId = log.getExercise().getId();
            UUID latestSessionId = latestSessionByExercise.get(exerciseId);
            if (latestSessionId != null && latestSessionId.equals(log.getWorkoutSession().getId())) {
                result.computeIfAbsent(exerciseId, id -> new ArrayList<>()).add(log);
            }
        }
        return result;
    }

    private NextTargetDto target(PlaylistExercise item, List<WorkoutLog> sets) {
        Exercise exercise = item.getExercise();
        Integer repsMin = item.getTargetRepsMin();
        Integer repsMax = item.getTargetRepsMax();

        Double lastWeight = sets.stream()
            .map(WorkoutLog::getWeight)
            .filter(Objects::nonNull)
            .max(Double::compareTo)
            .orElse(null);
        Integer lastReps = sets.stream()
            .max(Comparator.comparing(WorkoutLog::getSetNumber))
            .map(WorkoutLog::getReps)
            .orElse(null);

        Double suggestedWeight = null;
        Integer suggestedReps = null;

        if (repsMax != null) {
            if (sets.isEmpty()) {
                suggestedReps = repsMin;
            } else if (sets.stream().allMatch(log -> log.getReps() >= repsMax)) {
                double increment = exercise.getIncrementKg() == null
                    ? DEFAULT_INCREMENT_KG : exercise.getIncrementKg();
                if (increment > 0) {
                    suggestedWeight = lastWeight + increment;
                    suggestedReps = repsMin;
                } else {
                    suggestedWeight = lastWeight;
                    suggestedReps = Math.min(lastReps + 1, repsMax);
                }
            } else {
                suggestedWeight = lastWeight;
                suggestedReps = Math.min(lastReps + 1, repsMax);
            }
        }

        return new NextTargetDto(
            exercise.getId(),
            exercise.getName(),
            item.getTargetSets(),
            repsMin,
            repsMax,
            lastWeight,
            lastReps,
            suggestedWeight,
            suggestedReps);
    }
}
