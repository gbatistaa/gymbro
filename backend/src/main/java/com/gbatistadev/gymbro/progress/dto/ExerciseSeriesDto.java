package com.gbatistadev.gymbro.progress.dto;

import com.gbatistadev.gymbro.progress.SeriesBucket;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Evolução de um exercício em {@code [from, to)}. Só há ponto para os períodos com séries
 * registradas; {@code periodStart} é o início do período no fuso do usuário.
 */
public record ExerciseSeriesDto(
    UUID exerciseId,
    String name,
    String primaryMuscle,
    SeriesBucket bucket,
    Instant from,
    Instant to,
    List<SeriesPointDto> points,
    SeriesSummaryDto summary
) {
    public record SeriesPointDto(
        Instant periodStart,
        long sessions,
        long sets,
        long reps,
        double maxWeight,
        double volume,
        double bestE1rm
    ) {
    }

    /** Totais do período; os máximos e a data são {@code null} sem séries. */
    public record SeriesSummaryDto(
        long sessionCount,
        long totalSets,
        long totalReps,
        double totalVolume,
        Double bestWeight,
        Double bestE1rm,
        Instant lastPerformedAt
    ) {
    }
}
