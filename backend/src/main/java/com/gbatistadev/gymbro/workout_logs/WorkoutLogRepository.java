package com.gbatistadev.gymbro.workout_logs;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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
        SELECT COALESCE(MAX(l.weight * (1 + l.reps / 30.0)), 0) FROM WorkoutLog l
        WHERE l.exercise.id = :exerciseId
          AND l.workoutSession.userId = :userId
          AND l.workoutSession.id <> :sessionId
    """)
    Double maxE1rmExcludingSession(
        @Param("userId") UUID userId,
        @Param("exerciseId") UUID exerciseId,
        @Param("sessionId") UUID sessionId);
}
