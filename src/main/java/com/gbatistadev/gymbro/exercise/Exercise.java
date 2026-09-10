package com.gbatistadev.gymbro.exercise;

import com.gbatistadev.gymbro.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Entity
@NoArgsConstructor
@Table(name = "exercises")
public class Exercise extends BaseEntity {
    @Column(nullable = false)
    private String name;

    @Column(name = "primary_muscle", nullable = false)
    private String primaryMuscle;

    @Column(name = "secondary_muscle", nullable = false)
    private String secondaryMuscle;
}
