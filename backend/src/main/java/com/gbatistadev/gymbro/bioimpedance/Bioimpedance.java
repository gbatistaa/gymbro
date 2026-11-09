package com.gbatistadev.gymbro.bioimpedance;

import com.gbatistadev.gymbro.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Entity
@NoArgsConstructor
@Table(name = "bioimpedance")
public class Bioimpedance extends BaseEntity {
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "body_fat_percentage", nullable = false)
    private Double bodyFatPercentage;

    @Column(name = "muscle_mass_kg", nullable = false)
    private Double muscleMassKg;

    @Column(name = "visceral_fat")
    private Double visceralFat;

    @Column(name = "measured_at", nullable = false)
    private Instant measuredAt;

    @Column(name = "water_percentage")
    private Double waterPercentage;

    @Column(name = "body_weight_kg")
    private Double bodyWeightKg;

    @Column(name = "height_cm")
    private Double heightCm;

    @Column(name = "skeletal_muscle_mass_kg")
    private Double skeletalMuscleMassKg;

    @Column(nullable = false, length = 30)
    private String source = "MANUAL";

    @Column(name = "source_file_hash", length = 64)
    private String sourceFileHash;

    @Column(name = "deleted_at")
    private Instant deletedAt;
}
