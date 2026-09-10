package com.gbatistadev.gymbro.workout_logs;

public interface WorkoutLogRepository extends org.springframework.data.jpa.repository.JpaRepository<com.gbatistadev.gymbro.workout_logs.WorkoutLog, java.util.UUID> ,org.springframework.data.jpa.repository.JpaSpecificationExecutor<com.gbatistadev.gymbro.workout_logs.WorkoutLog> {
}