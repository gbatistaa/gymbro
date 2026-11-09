package com.gbatistadev.gymbro.workout_session;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface WorkoutSessionRepository extends JpaRepository<WorkoutSession, UUID> {

    Optional<WorkoutSession> findByIdAndUserId(UUID id, UUID userId);

    Optional<WorkoutSession> findByUserIdAndStatus(UUID userId, SessionStatus status);

    boolean existsByUserIdAndStatus(UUID userId, SessionStatus status);

    Page<WorkoutSession> findByUserIdAndStartedAtBetween(
        UUID userId, Instant from, Instant to, Pageable pageable);
}
