package com.gbatistadev.gymbro.exercise.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.gbatistadev.gymbro.exercise.Exercise;
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

    @NotBlank(message = "Secondary muscle is required")
    String secondaryMuscle
) {}