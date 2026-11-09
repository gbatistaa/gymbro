package com.gbatistadev.gymbro.exercise;

import com.gbatistadev.gymbro.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Entity
@NoArgsConstructor
@Table(name = "exercises")
public class Exercise extends BaseEntity {
    /** Null means a global catalog exercise; non-null means owned by that user. */
    @Column(name = "user_id")
    private UUID userId;

    @Column(nullable = false)
    private String name;

    @Column(name = "primary_muscle", nullable = false)
    private String primaryMuscle;

    @Column(name = "secondary_muscle", nullable = false)
    private String secondaryMuscle;
}
