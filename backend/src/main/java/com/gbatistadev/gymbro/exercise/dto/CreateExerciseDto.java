package com.gbatistadev.gymbro.exercise.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.gbatistadev.gymbro.exercise.Exercise;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.io.Serializable;

/**
 * DTO for {@link Exercise}
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record CreateExerciseDto (
    @NotBlank(message = "Name is required")
    @Size(min = 3, max = 225, message = "Name must be between 3 and 225 characters")
    String name,

    @NotBlank(message = "Primary muscle is required")
    String primaryMuscle,

    @Size(max = 100, message = "Secondary muscle must have at most 100 characters")
    String secondaryMuscle,

    @Size(max = 50, message = "Equipment must have at most 50 characters")
    String equipment,

    @DecimalMin(value = "0.0", message = "incrementKg cannot be negative")
    Double incrementKg
) {}
