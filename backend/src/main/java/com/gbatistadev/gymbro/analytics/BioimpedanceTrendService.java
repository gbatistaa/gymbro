package com.gbatistadev.gymbro.analytics;

import com.gbatistadev.gymbro.analytics.dto.TrendDto;
import com.gbatistadev.gymbro.bioimpedance.Bioimpedance;
import com.gbatistadev.gymbro.bioimpedance.BioimpedanceRepository;
import com.gbatistadev.gymbro.common.security.CurrentUser;
import com.gbatistadev.gymbro.errors.exceptions.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
public class BioimpedanceTrendService {
    private static final Set<String> METRICS = Set.of(
        "bodyWeightKg",
        "bodyFatPercentage",
        "muscleMassKg",
        "skeletalMuscleMassKg",
        "visceralFat",
        "waterPercentage");

    private final BioimpedanceRepository repository;
    private final CurrentUser currentUser;

    @Transactional(readOnly = true)
    public TrendDto trend(String metric, Instant from, Instant to, int window) {
        if (!METRICS.contains(metric)) {
            throw new BadRequestException("Unsupported metric: " + metric);
        }

        int size = Math.clamp(window, 1, 30);
        Instant start = from != null ? from : Instant.EPOCH;
        Instant end = to != null ? to : Instant.now();

        List<Bioimpedance> measurements = repository
            .findByUserIdAndDeletedAtIsNullAndMeasuredAtBetweenOrderByMeasuredAtAsc(
                currentUser.id(), start, end);

        List<TrendDto.TrendPointDto> points = new ArrayList<>();
        List<Double> values = new ArrayList<>();

        for (Bioimpedance measurement : measurements) {
            Double value = value(metric, measurement);
            if (value == null) {
                continue;
            }
            values.add(value);
            int fromIndex = Math.max(0, values.size() - size);
            double average = values.subList(fromIndex, values.size())
                .stream()
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(value);
            points.add(new TrendDto.TrendPointDto(
                measurement.getMeasuredAt(), value, average));
        }

        Double first = points.isEmpty() ? null : points.getFirst().value();
        Double last = points.isEmpty() ? null : points.getLast().value();
        Double delta = first == null ? null : last - first;
        Double percentage = first == null || first == 0 ? null : delta / first * 100;

        return new TrendDto(metric, points, delta, percentage);
    }

    private Double value(String metric, Bioimpedance measurement) {
        return switch (metric) {
            case "bodyWeightKg" -> measurement.getBodyWeightKg();
            case "bodyFatPercentage" -> measurement.getBodyFatPercentage();
            case "muscleMassKg" -> measurement.getMuscleMassKg();
            case "skeletalMuscleMassKg" -> measurement.getSkeletalMuscleMassKg();
            case "visceralFat" -> measurement.getVisceralFat();
            case "waterPercentage" -> measurement.getWaterPercentage();
            default -> null;
        };
    }
}
