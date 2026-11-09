package com.gbatistadev.gymbro.bioimpedance.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public record UpdateBioimpedanceRequest(
    @PastOrPresent(message = "measuredAt cannot be in the future")
    Instant measuredAt,

    @DecimalMin(value = "0.0", message = "bodyFatPercentage must be at least 0")
    @DecimalMax(value = "70.0", message = "bodyFatPercentage must be at most 70")
    Double bodyFatPercentage,

    @DecimalMin(value = "0.0", inclusive = false, message = "muscleMassKg must be positive")
    Double muscleMassKg,

    @DecimalMin(value = "0.0", message = "visceralFat must be at least 0")
    @DecimalMax(value = "60.0", message = "visceralFat must be at most 60")
    Double visceralFat,

    @DecimalMin(value = "0.0", message = "waterPercentage must be at least 0")
    @DecimalMax(value = "100.0", message = "waterPercentage must be at most 100")
    Double waterPercentage,

    @DecimalMin(value = "20.0", message = "bodyWeightKg must be at least 20")
    @DecimalMax(value = "400.0", message = "bodyWeightKg must be at most 400")
    Double bodyWeightKg,

    @DecimalMin(value = "100.0", message = "heightCm must be at least 100")
    @DecimalMax(value = "250.0", message = "heightCm must be at most 250")
    Double heightCm,

    @DecimalMin(value = "0.0", inclusive = false, message = "skeletalMuscleMassKg must be positive")
    Double skeletalMuscleMassKg,

    @Size(max = 30, message = "source must have at most 30 characters")
    String source,

    @Size(max = 64, message = "sourceFileHash must have at most 64 characters")
    String sourceFileHash
) {}
