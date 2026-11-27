package com.gbatistadev.gymbro.analytics;

import com.gbatistadev.gymbro.analytics.dto.BioimpedanceEvolutionDto;
import com.gbatistadev.gymbro.analytics.dto.BioimpedanceEvolutionDto.MetricEvolutionDto;
import com.gbatistadev.gymbro.bioimpedance.BioimpedanceRepository;
import com.gbatistadev.gymbro.bioimpedance.BioimpedanceSamples;
import com.gbatistadev.gymbro.common.security.CurrentUser;
import com.gbatistadev.gymbro.errors.exceptions.BadRequestException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("BioimpedanceEvolutionService")
class BioimpedanceEvolutionServiceTest {

    private static final Instant FROM = Instant.parse("2026-01-01T00:00:00Z");
    private static final Instant TO = Instant.parse("2026-04-01T00:00:00Z");

    @Mock
    private BioimpedanceRepository repository;

    @Mock
    private CurrentUser currentUser;

    @InjectMocks
    private BioimpedanceEvolutionService service;

    private final UUID userId = UUID.randomUUID();

    @Test
    @DisplayName("returns one series per metric, in a fixed order")
    void shouldReturnEveryMetricInFixedOrder() {
        when(currentUser.id()).thenReturn(userId);
        when(repository.findByUserIdAndDeletedAtIsNullAndMeasuredAtBetweenOrderByMeasuredAtAsc(userId, FROM, TO))
            .thenReturn(List.of());

        BioimpedanceEvolutionDto evolution = service.evolution(FROM, TO);

        assertEquals(
            List.of("bodyWeightKg", "bodyFatPercentage", "muscleMassKg",
                "skeletalMuscleMassKg", "visceralFat", "waterPercentage"),
            evolution.metrics().stream().map(MetricEvolutionDto::metric).toList());
        assertEquals(0, evolution.measurementCount());
        assertEquals(FROM, evolution.from());
        assertEquals(TO, evolution.to());
    }

    @Test
    @DisplayName("summarizes first, last, min, max and the change across the range")
    void shouldSummarizeMetric() {
        when(currentUser.id()).thenReturn(userId);
        when(repository.findByUserIdAndDeletedAtIsNullAndMeasuredAtBetweenOrderByMeasuredAtAsc(userId, FROM, TO))
            .thenReturn(List.of(
                BioimpedanceSamples.measurement(userId, Instant.parse("2026-01-10T10:00:00Z"), 84.0, 20.0),
                BioimpedanceSamples.measurement(userId, Instant.parse("2026-02-10T10:00:00Z"), 85.0, 19.0),
                BioimpedanceSamples.measurement(userId, Instant.parse("2026-03-10T10:00:00Z"), 80.0, 17.0)));

        MetricEvolutionDto weight = metric(service.evolution(FROM, TO), "bodyWeightKg");

        assertEquals(3, weight.points().size());
        assertEquals(Instant.parse("2026-01-10T10:00:00Z"), weight.points().getFirst().measuredAt());
        assertEquals(84.0, weight.first());
        assertEquals(80.0, weight.last());
        assertEquals(80.0, weight.min());
        assertEquals(85.0, weight.max());
        assertEquals(-4.0, weight.deltaAbsolute());
        assertEquals(-4.0 / 84.0 * 100, weight.deltaPercentage(), 1e-9);
    }

    @Test
    @DisplayName("leaves out measurements that did not record the metric")
    void shouldSkipMissingValues() {
        when(currentUser.id()).thenReturn(userId);
        when(repository.findByUserIdAndDeletedAtIsNullAndMeasuredAtBetweenOrderByMeasuredAtAsc(userId, FROM, TO))
            .thenReturn(List.of(
                BioimpedanceSamples.measurement(userId, Instant.parse("2026-01-10T10:00:00Z"), null, 20.0),
                BioimpedanceSamples.measurement(userId, Instant.parse("2026-02-10T10:00:00Z"), 82.0, 19.0)));

        BioimpedanceEvolutionDto evolution = service.evolution(FROM, TO);

        assertEquals(2, evolution.measurementCount());
        assertEquals(1, metric(evolution, "bodyWeightKg").points().size());
        assertEquals(2, metric(evolution, "bodyFatPercentage").points().size());
        assertTrue(metric(evolution, "waterPercentage").points().isEmpty());
    }

    @Test
    @DisplayName("has no change to report with a single value")
    void shouldNotReportChangeForSingleValue() {
        when(currentUser.id()).thenReturn(userId);
        when(repository.findByUserIdAndDeletedAtIsNullAndMeasuredAtBetweenOrderByMeasuredAtAsc(userId, FROM, TO))
            .thenReturn(List.of(
                BioimpedanceSamples.measurement(userId, Instant.parse("2026-01-10T10:00:00Z"), 82.0, 20.0)));

        MetricEvolutionDto weight = metric(service.evolution(FROM, TO), "bodyWeightKg");

        assertEquals(82.0, weight.first());
        assertEquals(82.0, weight.last());
        assertNull(weight.deltaAbsolute());
        assertNull(weight.deltaPercentage());
    }

    @Test
    @DisplayName("has no summary for a metric without values")
    void shouldLeaveEmptyMetricWithoutSummary() {
        when(currentUser.id()).thenReturn(userId);
        when(repository.findByUserIdAndDeletedAtIsNullAndMeasuredAtBetweenOrderByMeasuredAtAsc(userId, FROM, TO))
            .thenReturn(List.of(
                BioimpedanceSamples.measurement(userId, Instant.parse("2026-01-10T10:00:00Z"), 82.0, 20.0)));

        MetricEvolutionDto water = metric(service.evolution(FROM, TO), "waterPercentage");

        assertNull(water.first());
        assertNull(water.last());
        assertNull(water.min());
        assertNull(water.max());
        assertNull(water.deltaAbsolute());
        assertNull(water.deltaPercentage());
    }

    @Test
    @DisplayName("has no percentage change when the first value is zero")
    void shouldNotDivideByZero() {
        when(currentUser.id()).thenReturn(userId);
        when(repository.findByUserIdAndDeletedAtIsNullAndMeasuredAtBetweenOrderByMeasuredAtAsc(userId, FROM, TO))
            .thenReturn(List.of(
                BioimpedanceSamples.measurement(userId, Instant.parse("2026-01-10T10:00:00Z"), 82.0, 0.0),
                BioimpedanceSamples.measurement(userId, Instant.parse("2026-02-10T10:00:00Z"), 82.0, 2.0)));

        MetricEvolutionDto fat = metric(service.evolution(FROM, TO), "bodyFatPercentage");

        assertEquals(2.0, fat.deltaAbsolute());
        assertNull(fat.deltaPercentage());
    }

    @Test
    @DisplayName("rejects a range whose start is not before its end")
    void shouldRejectInvertedRange() {
        assertThrows(BadRequestException.class, () -> service.evolution(TO, FROM));
        assertThrows(BadRequestException.class, () -> service.evolution(FROM, FROM));
        verifyNoInteractions(repository);
    }

    private MetricEvolutionDto metric(BioimpedanceEvolutionDto evolution, String key) {
        return evolution.metrics().stream()
            .filter(metric -> metric.metric().equals(key))
            .findFirst()
            .orElseThrow();
    }
}
