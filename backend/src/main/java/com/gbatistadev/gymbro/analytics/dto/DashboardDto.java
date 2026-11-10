package com.gbatistadev.gymbro.analytics.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record DashboardDto(
    List<WeekSummaryDto> weeks,
    int currentStreakWeeks,
    List<RecentPrDto> recentPrs,
    Double weightDeltaKg,
    UUID nextPlaylistId,
    String nextPlaylistName
) {
    public record WeekSummaryDto(Instant weekStart, long sessions, double volume) {
    }

    public record RecentPrDto(
        UUID logId,
        UUID exerciseId,
        String exerciseName,
        Instant performedAt,
        Double weight,
        Integer reps,
        double e1rm
    ) {
    }
}
