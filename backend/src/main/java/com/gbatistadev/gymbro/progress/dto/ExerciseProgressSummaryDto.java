package com.gbatistadev.gymbro.progress.dto;

import java.time.Instant;
import java.util.UUID;

/** Um exercício já treinado, com os números de todo o histórico. */
public record ExerciseProgressSummaryDto(
    UUID exerciseId,
    String name,
    String primaryMuscle,
    long sessionCount,
    long totalSets,
    double totalVolume,
    double bestWeight,
    double bestE1rm,
    Instant lastPerformedAt,
    boolean isPinned
) {
}
