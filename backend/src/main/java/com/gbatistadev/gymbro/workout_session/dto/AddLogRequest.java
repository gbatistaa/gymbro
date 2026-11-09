package com.gbatistadev.gymbro.workout_session.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record AddLogRequest(
    @NotNull(message = "clientLogId is required")
    UUID clientLogId,

    @NotNull(message = "exerciseId is required")
    UUID exerciseId,

    @NotNull(message = "weight is required")
    @DecimalMin(value = "0.0", message = "weight cannot be negative")
    Double weight,

    @NotNull(message = "reps is required")
    @Min(value = 1, message = "reps must be at least 1")
    Integer reps,

    @Min(value = 1, message = "setNumber must be at least 1")
    Integer setNumber,

    @Min(value = 1, message = "rpe must be between 1 and 10")
    @Max(value = 10, message = "rpe must be between 1 and 10")
    Integer rpe,

    @Size(max = 500, message = "notes must have at most 500 characters")
    String notes
) {}
