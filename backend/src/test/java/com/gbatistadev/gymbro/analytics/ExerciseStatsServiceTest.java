package com.gbatistadev.gymbro.analytics;

import com.gbatistadev.gymbro.analytics.dto.ExerciseStatsDto;
import com.gbatistadev.gymbro.common.security.CurrentUser;
import com.gbatistadev.gymbro.errors.exceptions.NotFoundException;
import com.gbatistadev.gymbro.exercise.Exercise;
import com.gbatistadev.gymbro.exercise.ExerciseRepository;
import com.gbatistadev.gymbro.workout_logs.WorkoutLogRepository;
import com.gbatistadev.gymbro.workout_session.SessionStatus;
import com.gbatistadev.gymbro.user.User;
import com.gbatistadev.gymbro.user.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ExerciseStatsService")
class ExerciseStatsServiceTest {

    @Mock
    private WorkoutLogRepository logs;

    @Mock
    private ExerciseRepository exercises;

    @Mock
    private UserRepository users;

    @Mock
    private CurrentUser currentUser;

    @InjectMocks
    private ExerciseStatsService service;

    private final UUID userId = UUID.randomUUID();
    private final UUID exerciseId = UUID.randomUUID();

    @Test
    @DisplayName("aggregates totals and monthly buckets")
    void shouldReturnStats() {
        Instant last = Instant.parse("2026-11-08T10:00:00Z");
        WorkoutLogRepository.ExerciseAggregate aggregate =
            mock(WorkoutLogRepository.ExerciseAggregate.class);
        WorkoutLogRepository.MonthlyBucket bucket =
            mock(WorkoutLogRepository.MonthlyBucket.class);

        when(currentUser.id()).thenReturn(userId);
        when(exercises.findByIdForUser(exerciseId, userId)).thenReturn(Optional.of(new Exercise()));
        when(users.findById(userId)).thenReturn(Optional.of(userInZone("America/Sao_Paulo")));
        when(logs.aggregateExerciseStats(
            eq(userId), eq(exerciseId), eq(SessionStatus.FINISHED), any(), any()))
            .thenReturn(aggregate);
        when(aggregate.getSessionCount()).thenReturn(3L);
        when(aggregate.getTotalVolume()).thenReturn(2400.0);
        when(aggregate.getBestWeight()).thenReturn(100.0);
        when(aggregate.getBestE1rm()).thenReturn(133.33);
        when(aggregate.getLastPerformedAt()).thenReturn(last);
        when(logs.monthlyExerciseBuckets(eq(userId), eq(exerciseId), any(), any(), eq("America/Sao_Paulo")))
            .thenReturn(List.of(bucket));
        when(bucket.getPeriodStart()).thenReturn(Instant.parse("2026-11-01T03:00:00Z"));
        when(bucket.getVolume()).thenReturn(800.0);
        when(bucket.getBestE1rm()).thenReturn(120.0);

        ExerciseStatsDto stats = service.stats(exerciseId, null, null);

        assertEquals(3, stats.sessionCount());
        assertEquals(2400.0, stats.totalVolume());
        assertEquals(100.0, stats.bestWeight());
        assertEquals(last, stats.lastPerformedAt());
        assertEquals(1, stats.monthlyBuckets().size());
        assertEquals(800.0, stats.monthlyBuckets().getFirst().volume());
    }

    @Test
    @DisplayName("rejects an exercise from another user")
    void shouldRejectForeignExercise() {
        when(currentUser.id()).thenReturn(userId);
        when(exercises.findByIdForUser(exerciseId, userId)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> service.stats(exerciseId, null, null));
        verifyNoInteractions(logs);
    }

    @Test
    @DisplayName("passes the user's own time zone to the monthly bucket query")
    void shouldUseUserTimeZoneForBuckets() {
        when(currentUser.id()).thenReturn(userId);
        when(exercises.findByIdForUser(exerciseId, userId)).thenReturn(Optional.of(new Exercise()));
        when(users.findById(userId)).thenReturn(Optional.of(userInZone("Asia/Tokyo")));
        when(logs.aggregateExerciseStats(
            eq(userId), eq(exerciseId), eq(SessionStatus.FINISHED), any(), any()))
            .thenReturn(mock(WorkoutLogRepository.ExerciseAggregate.class));
        when(logs.monthlyExerciseBuckets(
            eq(userId), eq(exerciseId), any(), any(), eq("Asia/Tokyo")))
            .thenReturn(List.of());

        service.stats(exerciseId, null, null);

        verify(logs).monthlyExerciseBuckets(
            eq(userId), eq(exerciseId), any(), any(), eq("Asia/Tokyo"));
    }

    private User userInZone(String timeZone) {
        User user = new User();
        user.setId(userId);
        user.setName("Stats User");
        user.setEmail("stats@example.com");
        user.setUsername("stats_user");
        user.setPasswordHash("$2a$10$not-used");
        user.setTimezone(timeZone);
        return user;
    }
}
