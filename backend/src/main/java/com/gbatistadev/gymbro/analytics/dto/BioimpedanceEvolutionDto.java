package com.gbatistadev.gymbro.analytics.dto;

import java.time.Instant;
import java.util.List;

/** Evolução de todas as métricas de bioimpedância no intervalo {@code [from, to]}. */
public record BioimpedanceEvolutionDto(
    Instant from,
    Instant to,
    int measurementCount,
    List<MetricEvolutionDto> metrics
) {
    /**
     * Série de uma métrica. Os resumos são {@code null} sem valores; a variação exige pelo menos
     * dois valores, e a variação percentual também exige um primeiro valor diferente de zero.
     */
    public record MetricEvolutionDto(
        String metric,
        List<MetricPointDto> points,
        Double first,
        Double last,
        Double min,
        Double max,
        Double deltaAbsolute,
        Double deltaPercentage
    ) {
    }

    public record MetricPointDto(Instant measuredAt, double value) {
    }
}
