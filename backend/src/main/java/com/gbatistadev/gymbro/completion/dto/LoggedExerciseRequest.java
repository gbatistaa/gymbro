package com.gbatistadev.gymbro.completion.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.util.UUID;

/** Um exercício feito: todas as séries com o mesmo peso e as mesmas repetições. */
public record LoggedExerciseRequest(
    @NotNull(message = "exerciseId is required")
    UUID exerciseId,

    @NotNull(message = "sets is required")
    @Min(value = 1, message = "sets must be at least 1")
    @Max(value = 20, message = "sets must be at most 20")
    Integer sets,

    @NotNull(message = "reps is required")
    @Min(value = 1, message = "reps must be at least 1")
    @Max(value = 100, message = "reps must be at most 100")
    Integer reps,

    @NotNull(message = "weightKg is required")
    @PositiveOrZero(message = "weightKg cannot be negative")
    @Max(value = 1000, message = "weightKg must be at most 1000")
    Double weightKg
) {}
