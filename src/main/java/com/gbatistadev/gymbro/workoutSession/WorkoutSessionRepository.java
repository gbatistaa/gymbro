package com.gbatistadev.gymbro.workoutSession;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.UUID;

public interface WorkoutSessionRepository extends JpaRepository<WorkoutSession, UUID>, JpaSpecificationExecutor<WorkoutSession> {
}