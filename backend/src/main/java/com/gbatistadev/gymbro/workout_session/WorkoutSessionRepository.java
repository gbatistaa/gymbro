package com.gbatistadev.gymbro.workout_session;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkoutSessionRepository extends JpaRepository<WorkoutSession, UUID> {

    Optional<WorkoutSession> findByIdAndUserId(UUID id, UUID userId);

    Optional<WorkoutSession> findByUserIdAndStatus(UUID userId, SessionStatus status);

    boolean existsByUserIdAndStatus(UUID userId, SessionStatus status);

    Page<WorkoutSession> findByUserIdAndStartedAtBetween(
        UUID userId, Instant from, Instant to, Pageable pageable);

    @Query("""
        SELECT s FROM WorkoutSession s
        LEFT JOIN FETCH s.playlist
        WHERE s.userId = :userId AND s.status = :status
          AND s.startedAt >= :from AND s.startedAt < :to
        ORDER BY s.startedAt
    """)
    List<WorkoutSession> findFinishedWithPlaylist(
        @Param("userId") UUID userId,
        @Param("status") SessionStatus status,
        @Param("from") Instant from,
        @Param("to") Instant to);
}
