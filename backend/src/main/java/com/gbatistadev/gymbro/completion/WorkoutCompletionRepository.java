package com.gbatistadev.gymbro.completion;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkoutCompletionRepository extends JpaRepository<WorkoutCompletion, UUID> {

    @EntityGraph(attributePaths = {"playlist", "workoutSession"})
    List<WorkoutCompletion> findByUserIdOrderByCompletedAtDesc(UUID userId, Pageable pageable);

    Optional<WorkoutCompletion> findByIdAndUserId(UUID id, UUID userId);

    long countByUserId(UUID userId);

    long countByUserIdAndCompletedAtGreaterThanEqualAndCompletedAtLessThan(
        UUID userId, Instant from, Instant to);
}
