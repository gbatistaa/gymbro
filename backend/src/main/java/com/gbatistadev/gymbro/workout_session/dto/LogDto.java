package com.gbatistadev.gymbro.workout_session.dto;

import java.util.UUID;

public record LogDto(
    UUID id,
    UUID clientLogId,
    UUID exerciseId,
    String exerciseName,
    Integer setNumber,
    Double weight,
    Integer reps,
    Boolean isPr,
    Integer rpe,
    String notes
) {}
