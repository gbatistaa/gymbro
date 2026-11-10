package com.gbatistadev.gymbro.analytics.dto;

import java.util.UUID;

public record NextTargetDto(
    UUID exerciseId,
    String exerciseName,
    Integer targetSets,
    Integer targetRepsMin,
    Integer targetRepsMax,
    Double lastWeight,
    Integer lastReps,
    Double suggestedWeight,
    Integer suggestedReps
) {
}
