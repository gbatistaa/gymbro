package com.gbatistadev.gymbro.analytics;

import com.gbatistadev.gymbro.analytics.dto.BioimpedanceEvolutionDto;
import com.gbatistadev.gymbro.analytics.dto.BioimpedanceEvolutionDto.MetricEvolutionDto;
import com.gbatistadev.gymbro.analytics.dto.BioimpedanceEvolutionDto.MetricPointDto;
import com.gbatistadev.gymbro.bioimpedance.Bioimpedance;
import com.gbatistadev.gymbro.bioimpedance.BioimpedanceRepository;
import com.gbatistadev.gymbro.common.security.CurrentUser;
import com.gbatistadev.gymbro.errors.exceptions.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/** Painel de bioimpedância: a série de cada métrica no período, num único pedido. */
@Service
@RequiredArgsConstructor
public class BioimpedanceEvolutionService {
    private final BioimpedanceRepository repository;
    private final CurrentUser currentUser;

    @Transactional(readOnly = true)
    public BioimpedanceEvolutionDto evolution(Instant from, Instant to) {
        if (!from.isBefore(to)) {
            throw new BadRequestException("INVALID_RANGE", "from must be before to");
        }

        List<Bioimpedance> measurements = repository
            .findByUserIdAndDeletedAtIsNullAndMeasuredAtBetweenOrderByMeasuredAtAsc(
                currentUser.id(), from, to);

        List<MetricEvolutionDto> metrics = Arrays.stream(BioimpedanceMetric.values())
            .map(metric -> evolution(metric, measurements))
            .toList();

        return new BioimpedanceEvolutionDto(from, to, measurements.size(), metrics);
    }

    private MetricEvolutionDto evolution(BioimpedanceMetric metric, List<Bioimpedance> measurements) {
        List<MetricPointDto> points = new ArrayList<>();
        for (Bioimpedance measurement : measurements) {
            Double value = metric.valueOf(measurement);
            if (value != null) {
                points.add(new MetricPointDto(measurement.getMeasuredAt(), value));
            }
        }

        if (points.isEmpty()) {
            return new MetricEvolutionDto(metric.key(), points, null, null, null, null, null, null);
        }

        double first = points.getFirst().value();
        double last = points.getLast().value();
        double min = points.stream().mapToDouble(MetricPointDto::value).min().orElseThrow();
        double max = points.stream().mapToDouble(MetricPointDto::value).max().orElseThrow();
        Double delta = points.size() < 2 ? null : last - first;
        Double deltaPercentage = delta == null || first == 0 ? null : delta / first * 100;

        return new MetricEvolutionDto(metric.key(), points, first, last, min, max, delta, deltaPercentage);
    }
}
