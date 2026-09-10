package com.gbatistadev.gymbro.exercise.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Value;

import java.io.Serializable;

/**
 * DTO for {@link com.gbatistadev.gymbro.exercise.Exercise}
 */
@Value
@JsonIgnoreProperties(ignoreUnknown = true)
public class CreateExerciseDto implements Serializable {
    @NotBlank(message = "Name is required")
    @Size(min = 3, max = 225, message = "Name must be between 3 and 225 characters")
    String name;

    @NotBlank(message = "Primary muscle is required")
    String primaryMuscle;

    @NotBlank(message = "Secondary muscle is required")
    String secondaryMuscle;
}