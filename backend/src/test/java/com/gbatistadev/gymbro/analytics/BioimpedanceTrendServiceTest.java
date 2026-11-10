package com.gbatistadev.gymbro.analytics;

import com.gbatistadev.gymbro.analytics.dto.TrendDto;
import com.gbatistadev.gymbro.bioimpedance.Bioimpedance;
import com.gbatistadev.gymbro.bioimpedance.BioimpedanceRepository;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("BioimpedanceTrendService")
class BioimpedanceTrendServiceTest {

    @Mock
    private BioimpedanceRepository repository;

    @Mock
    private CurrentUser currentUser;

    @InjectMocks
    private BioimpedanceTrendService service;

    private final UUID userId = UUID.randomUUID();

    @Test
    @DisplayName("computes moving average and delta for the requested metric")
    void shouldComputeTrend() {
        when(currentUser.id()).thenReturn(userId);
        when(repository.findByUserIdAndDeletedAtIsNullAndMeasuredAtBetweenOrderByMeasuredAtAsc(
            eq(userId), any(), any()))
            .thenReturn(List.of(
                measurement(80.0), measurement(82.0), measurement(84.0)));

        TrendDto trend = service.trend("bodyWeightKg", null, null, 2);

        assertEquals(3, trend.points().size());
        assertEquals(80.0, trend.points().get(0).movingAverage());
        assertEquals(81.0, trend.points().get(1).movingAverage());
        assertEquals(83.0, trend.points().get(2).movingAverage());
        assertEquals(4.0, trend.deltaAbsolute());
        assertEquals(5.0, trend.deltaPercentage());
    }

    @Test
    @DisplayName("skips null measurements")
    void shouldSkipNullValues() {
        Bioimpedance missing = measurement(null);
        when(currentUser.id()).thenReturn(userId);
        when(repository.findByUserIdAndDeletedAtIsNullAndMeasuredAtBetweenOrderByMeasuredAtAsc(
            eq(userId), any(), any()))
            .thenReturn(List.of(missing, measurement(80.0)));

        TrendDto trend = service.trend("bodyWeightKg", null, null, 7);

        assertEquals(1, trend.points().size());
        assertEquals(0.0, trend.deltaAbsolute());
        assertEquals(0.0, trend.deltaPercentage());
    }

    @Test
    @DisplayName("rejects an unknown metric")
    void shouldRejectUnknownMetric() {
        assertThrows(BadRequestException.class,
            () -> service.trend("peso", null, null, 7));
        verifyNoInteractions(repository);
    }

    private Bioimpedance measurement(Double weight) {
        Bioimpedance measurement = new Bioimpedance();
        measurement.setMeasuredAt(Instant.now());
        measurement.setBodyWeightKg(weight);
        measurement.setBodyFatPercentage(18.0);
        measurement.setMuscleMassKg(38.0);
        return measurement;
    }
}
