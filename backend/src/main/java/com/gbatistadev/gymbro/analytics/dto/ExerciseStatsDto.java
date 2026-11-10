package com.gbatistadev.gymbro.analytics.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ExerciseStatsDto(
    UUID exerciseId,
    long sessionCount,
    double totalVolume,
    Double bestWeight,
    Double bestE1rm,
    Instant lastPerformedAt,
    List<MonthlyBucketDto> monthlyBuckets
) {
    public record MonthlyBucketDto(Instant periodStart, double volume, Double bestE1rm) {
    }
}
