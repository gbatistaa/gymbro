package com.gbatistadev.gymbro.bioimpedance.dto;

import java.time.Instant;
import java.util.UUID;

public record BioimpedanceDto(
    UUID id,
    Instant measuredAt,
    Double bodyWeightKg,
    Double heightCm,
    Double bodyFatPercentage,
    Double muscleMassKg,
    Double skeletalMuscleMassKg,
    Double visceralFat,
    Double waterPercentage,
    String source,
    String sourceFileHash
) {}
