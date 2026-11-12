package com.gbatistadev.gymbro.workout_logs;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkoutLogRepository extends JpaRepository<WorkoutLog, UUID> {

    Optional<WorkoutLog> findByWorkoutSessionIdAndClientLogId(UUID sessionId, UUID clientLogId);

    Optional<WorkoutLog> findByIdAndWorkoutSessionId(UUID id, UUID sessionId);

    long countByWorkoutSessionId(UUID sessionId);

    boolean existsByExerciseId(UUID exerciseId);

    @Query("""
        SELECT l FROM WorkoutLog l
        JOIN FETCH l.exercise e
        WHERE l.workoutSession.id = :sessionId
        ORDER BY e.name, l.setNumber
    """)
    List<WorkoutLog> findDetailBySessionId(@Param("sessionId") UUID sessionId);

    @Query("""
        SELECT COALESCE(MAX(l.setNumber), 0) FROM WorkoutLog l
        WHERE l.workoutSession.id = :sessionId AND l.exercise.id = :exerciseId
    """)
    int maxSetNumber(@Param("sessionId") UUID sessionId, @Param("exerciseId") UUID exerciseId);

    @Query("""
        SELECT COALESCE(SUM(l.weight * l.reps), 0) FROM WorkoutLog l
        WHERE l.workoutSession.id = :sessionId
    """)
    Double sumVolume(@Param("sessionId") UUID sessionId);

    @Query("""
        SELECT COALESCE(MAX(CASE WHEN l.reps = 1 THEN l.weight
                                 ELSE l.weight * (1 + l.reps / 30.0) END), 0)
        FROM WorkoutLog l
        WHERE l.exercise.id = :exerciseId
          AND l.workoutSession.userId = :userId
          AND l.workoutSession.id <> :sessionId
    """)
    Double maxE1rmExcludingSession(
        @Param("userId") UUID userId,
        @Param("exerciseId") UUID exerciseId,
        @Param("sessionId") UUID sessionId);

    @Query("""
        SELECT COUNT(DISTINCT s.id) AS sessionCount,
               COALESCE(SUM(l.weight * l.reps), 0) AS totalVolume,
               MAX(l.weight) AS bestWeight,
               MAX(CASE WHEN l.reps = 1 THEN l.weight
                        ELSE l.weight * (1 + l.reps / 30.0) END) AS bestE1rm,
               MAX(s.startedAt) AS lastPerformedAt
        FROM WorkoutLog l
        JOIN l.workoutSession s
        WHERE s.userId = :userId AND s.status = :status
          AND l.exercise.id = :exerciseId
          AND s.startedAt >= :from AND s.startedAt < :to
    """)
    ExerciseAggregate aggregateExerciseStats(
        @Param("userId") UUID userId,
        @Param("exerciseId") UUID exerciseId,
        @Param("status") com.gbatistadev.gymbro.workout_session.SessionStatus status,
        @Param("from") Instant from,
        @Param("to") Instant to);

    @Query(value = """
        SELECT (date_trunc('month', s.started_at AT TIME ZONE 'America/Sao_Paulo')
                    AT TIME ZONE 'America/Sao_Paulo') AS "periodStart",
               SUM(l.weight * l.reps) AS "volume",
               MAX(CASE WHEN l.reps = 1 THEN l.weight
                        ELSE l.weight * (1 + l.reps / 30.0) END) AS "bestE1rm"
        FROM workout_log l
        JOIN workout_session s ON s.id = l.workout_session_id
        WHERE s.user_id = :userId AND s.status = 'FINISHED'
          AND l.exercise_id = :exerciseId
          AND s.started_at >= :from AND s.started_at < :to
        GROUP BY 1
        ORDER BY 1
    """, nativeQuery = true)
    List<MonthlyBucket> monthlyExerciseBuckets(
        @Param("userId") UUID userId,
        @Param("exerciseId") UUID exerciseId,
        @Param("from") Instant from,
        @Param("to") Instant to);

    @Query(value = """
        SELECT DISTINCT ON (l.exercise_id)
               l.exercise_id AS "exerciseId",
               l.workout_session_id AS "sessionId"
        FROM workout_log l
        JOIN workout_session s ON s.id = l.workout_session_id
        WHERE s.user_id = :userId AND s.status = 'FINISHED'
          AND l.exercise_id IN (:exerciseIds)
        ORDER BY l.exercise_id, s.started_at DESC
    """, nativeQuery = true)
    List<LatestExerciseSession> findLatestFinishedSessionPerExercise(
        @Param("userId") UUID userId,
        @Param("exerciseIds") Collection<UUID> exerciseIds);

    @Query("""
        SELECT l FROM WorkoutLog l
        JOIN FETCH l.exercise
        WHERE l.workoutSession.id IN :sessionIds
    """)
    List<WorkoutLog> findBySessionIdsWithExercise(@Param("sessionIds") Collection<UUID> sessionIds);

    @Query("""
        SELECT l FROM WorkoutLog l
        JOIN FETCH l.exercise
        JOIN FETCH l.workoutSession s
        WHERE s.userId = :userId AND l.isPr = true
          AND s.startedAt >= :from AND s.startedAt < :to
        ORDER BY s.startedAt DESC, l.setNumber DESC
    """)
    List<WorkoutLog> findRecentPrs(
        @Param("userId") UUID userId,
        @Param("from") Instant from,
        @Param("to") Instant to,
        Pageable pageable);

    @Query(value = """
        SELECT initcap(lower(trim(e.primary_muscle))) AS "muscle",
               SUM(l.weight * l.reps) AS "volume",
               COUNT(*) AS "sets"
        FROM workout_log l
        JOIN workout_session s ON s.id = l.workout_session_id
        JOIN exercises e ON e.id = l.exercise_id
        WHERE s.user_id = :userId AND s.status = 'FINISHED'
          AND s.started_at >= :from AND s.started_at < :to
        GROUP BY lower(trim(e.primary_muscle))
        ORDER BY SUM(l.weight * l.reps) DESC, lower(trim(e.primary_muscle))
        """, nativeQuery = true)
    List<MuscleVolumeProjection> findMuscleVolume(
        @Param("userId") UUID userId,
        @Param("from") Instant from,
        @Param("to") Instant to);

    interface ExerciseAggregate {
        Long getSessionCount();

        Double getTotalVolume();

        Double getBestWeight();

        Double getBestE1rm();

        Instant getLastPerformedAt();
    }

    interface MonthlyBucket {
        Instant getPeriodStart();

        Double getVolume();

        Double getBestE1rm();
    }

    interface MuscleVolumeProjection {
        String getMuscle();

        Double getVolume();

        Long getSets();
    }

    interface LatestExerciseSession {
        UUID getExerciseId();

        UUID getSessionId();
    }
}
