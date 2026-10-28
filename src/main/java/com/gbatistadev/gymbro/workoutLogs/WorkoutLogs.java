package com.gbatistadev.gymbro.workoutLogs;

import com.gbatistadev.gymbro.common.BaseEntity;
import com.gbatistadev.gymbro.exercise.Exercise;
import com.gbatistadev.gymbro.workoutSession.WorkoutSession;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Entity
@NoArgsConstructor
@Table(name = "workout_logs")
public class WorkoutLogs extends BaseEntity {
    @Column(name = "set_number", nullable = false)
    private Integer setNumber;

    @Column(nullable = false, precision = 2)
    private Double weight;

    @ManyToOne(optional = false)
    @JoinColumn(name = "workout_session_id", nullable = false)
    private WorkoutSession workoutSession;

    @ManyToOne(optional = false)
    @JoinColumn(name = "exercise_id", nullable = false)
    private Exercise exercise;

}