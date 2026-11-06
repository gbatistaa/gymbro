package com.gbatistadev.gymbro.bioimpedance;

import com.gbatistadev.gymbro.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@NoArgsConstructor
@Table(name = "bioimpedance")
public class Bioimpedance extends BaseEntity {
    @Column(name = "body_fat_percentage", nullable = false)
    private Double bodyFatPercentage;

    @Column(name = "muscle_mass_kg", nullable = false)
    private Double muscleMassKg;

    @Column(name = "visceral_fat", nullable = false)
    private Double visceralFat;

    @Column(name = "measured_at", nullable = false)
    private Instant measuredAt;

    @Column(name = "water_percentage", nullable = false)
    private Double waterPercentage;
}