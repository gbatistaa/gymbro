package com.gbatistadev.gymbro.workout_logs;

import com.gbatistadev.gymbro.common.BaseEntity;
import com.gbatistadev.gymbro.exercise.Exercise;
import com.gbatistadev.gymbro.workout_session.WorkoutSession;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Entity
@NoArgsConstructor
@Table(name = "workout_log")
public class WorkoutLog extends BaseEntity {
    @Column(name = "set_number", nullable = false)
    private Integer setNumber;

    @Column(nullable = false, precision = 1)
    private Double weight;

    @Column(nullable = false)
    private Integer reps;

    @Column(name = "is_pr", nullable = false)
    private Boolean isPr;

    @ManyToOne(optional = false)
    @JoinColumn(name = "exercise_id", nullable = false)
    private Exercise exercise;

    @ManyToOne(optional = false)
    @JoinColumn(name = "workout_session_id", nullable = false)
    private WorkoutSession workoutSession;
}