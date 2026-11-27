package com.gbatistadev.gymbro.progress;

import com.gbatistadev.gymbro.common.BaseEntity;
import com.gbatistadev.gymbro.exercise.Exercise;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/** Exercício fixado no painel de Progresso; {@code position} vai de 0 a 3. */
@Getter
@Setter
@Entity
@NoArgsConstructor
@Table(name = "user_pinned_exercises")
public class PinnedExercise extends BaseEntity {
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "exercise_id", nullable = false)
    private Exercise exercise;

    @Column(nullable = false)
    private Integer position;
}
