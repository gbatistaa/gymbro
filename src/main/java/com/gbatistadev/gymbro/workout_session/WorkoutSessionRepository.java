package com.gbatistadev.gymbro.workout_session;

public interface WorkoutSessionRepository extends org.springframework.data.jpa.repository.JpaRepository<com.gbatistadev.gymbro.workout_session.WorkoutSession, java.util.UUID> ,org.springframework.data.jpa.repository.JpaSpecificationExecutor<com.gbatistadev.gymbro.workout_session.WorkoutSession> {
}