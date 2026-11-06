package com.gbatistadev.gymbro.playlist_exercises;

import com.gbatistadev.gymbro.common.BaseEntity;
import com.gbatistadev.gymbro.exercise.Exercise;
import com.gbatistadev.gymbro.playlist.Playlist;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Entity
@NoArgsConstructor
@Table(name = "playlist_exercise")
public class PlaylistExercise extends BaseEntity {
    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;

    @Column(name = "target_sets", nullable = false)
    private Integer targetSets;

    @ManyToOne(optional = false)
    @JoinColumn(name = "playlist_id", nullable = false)
    private Playlist playlist;

    @ManyToOne(optional = false)
    @JoinColumn(name = "exercise_id", nullable = false)
    private Exercise exercise;
}