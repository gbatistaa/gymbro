package com.gbatistadev.gymbro.exercise.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

/**
 * DTO for {@link com.gbatistadev.gymbro.exercise.Exercise}
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ExerciseDto implements Serializable {
    private UUID id;
    private Instant createdAt;
    private Instant updatedAt;
    private String name;
    private String primaryMuscle;
    private String secondaryMuscle;
}