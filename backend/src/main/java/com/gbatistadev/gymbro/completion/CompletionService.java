package com.gbatistadev.gymbro.completion;

import com.gbatistadev.gymbro.common.security.CurrentUser;
import com.gbatistadev.gymbro.completion.dto.CompleteWorkoutRequest;
import com.gbatistadev.gymbro.completion.dto.CompletionDto;
import com.gbatistadev.gymbro.completion.dto.CompletionSummaryDto;
import com.gbatistadev.gymbro.completion.dto.LoggedExerciseRequest;
import com.gbatistadev.gymbro.errors.exceptions.ConflictException;
import com.gbatistadev.gymbro.errors.exceptions.NotFoundException;
import com.gbatistadev.gymbro.exercise.Exercise;
import com.gbatistadev.gymbro.exercise.ExerciseRepository;
import com.gbatistadev.gymbro.playlist.Playlist;
import com.gbatistadev.gymbro.playlist.PlaylistRepository;
import com.gbatistadev.gymbro.user.UserRepository;
import com.gbatistadev.gymbro.workout_logs.WorkoutLog;
import com.gbatistadev.gymbro.workout_logs.WorkoutLogRepository;
import com.gbatistadev.gymbro.workout_session.SessionStatus;
import com.gbatistadev.gymbro.workout_session.WorkoutSession;
import com.gbatistadev.gymbro.workout_session.WorkoutSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * "Fiz o treino". Sem cronômetro: os exercícios feitos viram uma sessão já finalizada (início = fim),
 * e cada série vira uma linha de workout_log. Assim volume, PRs, dashboard e progresso continuam
 * lendo da mesma fonte.
 */
@Service
@RequiredArgsConstructor
public class CompletionService {
    private final WorkoutCompletionRepository completions;
    private final PlaylistRepository playlists;
    private final ExerciseRepository exercises;
    private final WorkoutSessionRepository sessions;
    private final WorkoutLogRepository logs;
    private final UserRepository users;
    private final CurrentUser currentUser;
    private final Clock clock;

    @Transactional
    public CompletionDto complete(UUID playlistId, CompleteWorkoutRequest request) {
        UUID userId = currentUser.id();
        Playlist playlist = playlists.findByIdAndUserId(playlistId, userId)
            .orElseThrow(() -> new NotFoundException("Playlist not found: " + playlistId));

        if (playlist.getArchivedAt() != null) {
            throw new ConflictException("PLAYLIST_ARCHIVED", "Archived plans cannot be marked as done");
        }

        Instant now = clock.instant();
        WorkoutSession session = sessions.save(finishedSession(userId, playlist, now));
        List<WorkoutLog> loggedSets = logSets(userId, session, request);
        session.setTotalVolume(volumeOf(loggedSets));

        WorkoutCompletion completion = new WorkoutCompletion();
        completion.setUserId(userId);
        completion.setPlaylist(playlist);
        completion.setCompletedAt(now);
        completion.setWorkoutSession(session);

        return toDto(completions.save(completion));
    }

    @Transactional(readOnly = true)
    public List<CompletionDto> recent(int size) {
        int pageSize = Math.clamp(size, 1, 50);
        return completions.findByUserIdOrderByCompletedAtDesc(
                currentUser.id(),
                PageRequest.of(0, pageSize, Sort.by(Sort.Direction.DESC, "completedAt")))
            .stream()
            .map(this::toDto)
            .toList();
    }

    @Transactional(readOnly = true)
    public CompletionSummaryDto summary() {
        UUID userId = currentUser.id();
        ZoneId zone = userZone(userId);

        LocalDate currentWeek = LocalDate.now(clock.withZone(zone))
            .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        Instant weekStart = currentWeek.atStartOfDay(zone).toInstant();
        Instant weekEnd = currentWeek.plusWeeks(1).atStartOfDay(zone).toInstant();

        return new CompletionSummaryDto(
            completions.countByUserId(userId),
            completions.countByUserIdAndCompletedAtGreaterThanEqualAndCompletedAtLessThan(
                userId, weekStart, weekEnd));
    }

    /** Desfazer apaga também a sessão registrada; as séries saem junto por cascata no banco. */
    @Transactional
    public void delete(UUID completionId) {
        WorkoutCompletion completion = completions.findByIdAndUserId(completionId, currentUser.id())
            .orElseThrow(() -> new NotFoundException("Completion not found: " + completionId));

        WorkoutSession session = completion.getWorkoutSession();
        completions.delete(completion);
        if (session != null) {
            completions.flush();
            sessions.delete(session);
        }
    }

    private WorkoutSession finishedSession(UUID userId, Playlist playlist, Instant now) {
        WorkoutSession session = new WorkoutSession();
        session.setUserId(userId);
        session.setPlaylist(playlist);
        session.setStartedAt(now);
        session.setEndedAt(now);
        session.setStatus(SessionStatus.FINISHED);
        session.setTotalVolume(0.0);
        return session;
    }

    private List<WorkoutLog> logSets(UUID userId, WorkoutSession session, CompleteWorkoutRequest request) {
        if (request == null || request.exercises() == null) {
            return List.of();
        }

        Map<UUID, Integer> nextSetNumber = new HashMap<>();
        Map<UUID, Double> bestE1rm = new HashMap<>();
        List<WorkoutLog> result = new ArrayList<>();

        for (LoggedExerciseRequest entry : request.exercises()) {
            Exercise exercise = exercises.findByIdForUser(entry.exerciseId(), userId)
                .orElseThrow(() -> new NotFoundException("Exercise not found: " + entry.exerciseId()));

            for (int set = 0; set < entry.sets(); set++) {
                int setNumber = nextSetNumber.merge(exercise.getId(), 1, Integer::sum);
                double previousBest = bestE1rm.computeIfAbsent(exercise.getId(),
                    id -> logs.maxE1rmExcludingSession(userId, id, session.getId()));
                double candidate = estimateOneRepMax(entry.weightKg(), entry.reps());

                WorkoutLog log = new WorkoutLog();
                log.setClientLogId(UUID.randomUUID());
                log.setWorkoutSession(session);
                log.setExercise(exercise);
                log.setSetNumber(setNumber);
                log.setWeight(entry.weightKg());
                log.setReps(entry.reps());
                log.setIsPr(candidate > previousBest);
                if (candidate > previousBest) {
                    bestE1rm.put(exercise.getId(), candidate);
                }
                result.add(logs.save(log));
            }
        }
        return result;
    }

    private double estimateOneRepMax(double weight, int reps) {
        return reps == 1 ? weight : weight * (1 + reps / 30.0);
    }

    private double volumeOf(List<WorkoutLog> loggedSets) {
        return loggedSets.stream().mapToDouble(log -> log.getWeight() * log.getReps()).sum();
    }

    private ZoneId userZone(UUID userId) {
        return users.findById(userId)
            .map(user -> ZoneId.of(user.getTimezone()))
            .orElseThrow(() -> new NotFoundException("User not found: " + userId));
    }

    private CompletionDto toDto(WorkoutCompletion completion) {
        WorkoutSession session = completion.getWorkoutSession();
        int loggedSets = session == null ? 0 : (int) logs.countByWorkoutSessionId(session.getId());
        double totalVolume = session == null || session.getTotalVolume() == null ? 0 : session.getTotalVolume();

        return new CompletionDto(
            completion.getId(),
            completion.getPlaylist().getId(),
            completion.getPlaylist().getName(),
            completion.getCompletedAt(),
            loggedSets,
            totalVolume);
    }
}
