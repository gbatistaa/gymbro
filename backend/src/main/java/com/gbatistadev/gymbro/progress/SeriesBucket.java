package com.gbatistadev.gymbro.progress;

/** Granularidade da série. A semana começa na segunda (ISO), como no resto do app. */
public enum SeriesBucket {
    DAY("day"),
    WEEK("week"),
    MONTH("month");

    private final String dateTruncUnit;

    SeriesBucket(String dateTruncUnit) {
        this.dateTruncUnit = dateTruncUnit;
    }

    String dateTruncUnit() {
        return dateTruncUnit;
    }
}
