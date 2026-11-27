package com.gbatistadev.gymbro.bioimpedance;

import java.time.Instant;
import java.util.UUID;

/** Medições de bioimpedância para testes. Cada fábrica devolve uma instância nova. */
public final class BioimpedanceSamples {
    private BioimpedanceSamples() {
    }

    /** Medição com as métricas obrigatórias e o peso; as opcionais ficam vazias. */
    public static Bioimpedance measurement(
        UUID userId, Instant measuredAt, Double bodyWeightKg, double bodyFatPercentage
    ) {
        Bioimpedance measurement = new Bioimpedance();
        measurement.setUserId(userId);
        measurement.setMeasuredAt(measuredAt);
        measurement.setBodyWeightKg(bodyWeightKg);
        measurement.setBodyFatPercentage(bodyFatPercentage);
        measurement.setMuscleMassKg(38.0);
        return measurement;
    }

    /** Medição com todas as métricas preenchidas. */
    public static Bioimpedance completeMeasurement(UUID userId, Instant measuredAt) {
        Bioimpedance measurement = measurement(userId, measuredAt, 82.0, 18.0);
        measurement.setSkeletalMuscleMassKg(34.0);
        measurement.setVisceralFat(7.0);
        measurement.setWaterPercentage(55.0);
        measurement.setHeightCm(178.0);
        return measurement;
    }
}
