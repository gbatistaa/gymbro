package com.gbatistadev.gymbro.analytics;

import com.gbatistadev.gymbro.analytics.dto.ExerciseStatsDto;
import com.gbatistadev.gymbro.common.security.CurrentUser;
import com.gbatistadev.gymbro.errors.exceptions.NotFoundException;
import com.gbatistadev.gymbro.exercise.ExerciseRepository;
import com.gbatistadev.gymbro.workout_logs.WorkoutLogRepository;
import com.gbatistadev.gymbro.workout_session.SessionStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ExerciseStatsService {
    private final WorkoutLogRepository logs;
    private final ExerciseRepository exercises;
    private final CurrentUser currentUser;

    @Transactional(readOnly = true)
    public ExerciseStatsDto stats(UUID exerciseId, Instant from, Instant to) {
        UUID userId = currentUser.id();
        exercises.findByIdForUser(exerciseId, userId)
            .orElseThrow(() -> new NotFoundException("Exercise not found: " + exerciseId));

        Instant start = from != null ? from : Instant.EPOCH;
        Instant end = to != null ? to : Instant.now();

        WorkoutLogRepository.ExerciseAggregate aggregate = logs.aggregateExerciseStats(
            userId, exerciseId, SessionStatus.FINISHED, start, end);

        List<ExerciseStatsDto.MonthlyBucketDto> buckets = logs
            .monthlyExerciseBuckets(userId, exerciseId, start, end)
            .stream()
            .map(bucket -> new ExerciseStatsDto.MonthlyBucketDto(
                bucket.getPeriodStart(), bucket.getVolume(), bucket.getBestE1rm()))
            .toList();

        return new ExerciseStatsDto(
            exerciseId,
            aggregate.getSessionCount() == null ? 0 : aggregate.getSessionCount(),
            aggregate.getTotalVolume() == null ? 0 : aggregate.getTotalVolume(),
            aggregate.getBestWeight(),
            aggregate.getBestE1rm(),
            aggregate.getLastPerformedAt(),
            buckets);
    }
}
