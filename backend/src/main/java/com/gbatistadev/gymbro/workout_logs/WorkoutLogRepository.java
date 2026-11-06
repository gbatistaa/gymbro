package com.gbatistadev.gymbro.workout_logs;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.UUID;

public interface WorkoutLogRepository extends JpaRepository<WorkoutLog, UUID>, JpaSpecificationExecutor<WorkoutLog> {
}