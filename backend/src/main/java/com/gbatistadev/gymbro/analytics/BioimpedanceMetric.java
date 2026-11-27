package com.gbatistadev.gymbro.analytics;

import com.gbatistadev.gymbro.bioimpedance.Bioimpedance;

import java.util.Arrays;
import java.util.Optional;
import java.util.function.Function;

/**
 * Métricas de bioimpedância com evolução no tempo. A ordem de declaração é a ordem de exibição, e
 * {@link #key()} é o nome usado na API (o mesmo do campo no JSON da medição).
 */
public enum BioimpedanceMetric {
    BODY_WEIGHT_KG("bodyWeightKg", Bioimpedance::getBodyWeightKg),
    BODY_FAT_PERCENTAGE("bodyFatPercentage", Bioimpedance::getBodyFatPercentage),
    MUSCLE_MASS_KG("muscleMassKg", Bioimpedance::getMuscleMassKg),
    SKELETAL_MUSCLE_MASS_KG("skeletalMuscleMassKg", Bioimpedance::getSkeletalMuscleMassKg),
    VISCERAL_FAT("visceralFat", Bioimpedance::getVisceralFat),
    WATER_PERCENTAGE("waterPercentage", Bioimpedance::getWaterPercentage);

    private final String key;
    private final Function<Bioimpedance, Double> reader;

    BioimpedanceMetric(String key, Function<Bioimpedance, Double> reader) {
        this.key = key;
        this.reader = reader;
    }

    public String key() {
        return key;
    }

    /** Valor da métrica na medição, ou {@code null} quando ela não foi registrada. */
    public Double valueOf(Bioimpedance measurement) {
        return reader.apply(measurement);
    }

    public static Optional<BioimpedanceMetric> fromKey(String key) {
        return Arrays.stream(values())
            .filter(metric -> metric.key.equals(key))
            .findFirst();
    }
}
