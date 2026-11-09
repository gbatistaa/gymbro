package com.gbatistadev.gymbro.workout_session.dto;

import java.util.List;
import java.util.UUID;

public record ExerciseLogsDto(
    UUID exerciseId,
    String exerciseName,
    List<LogDto> sets
) {}
