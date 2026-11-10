package com.gbatistadev.gymbro.analytics.dto;

import java.time.Instant;
import java.util.List;

public record TrendDto(
    String metric,
    List<TrendPointDto> points,
    Double deltaAbsolute,
    Double deltaPercentage
) {
    public record TrendPointDto(Instant measuredAt, Double value, Double movingAverage) {
    }
}
