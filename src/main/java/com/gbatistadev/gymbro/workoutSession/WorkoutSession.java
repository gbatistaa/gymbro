package com.gbatistadev.gymbro.workoutSession;

import com.gbatistadev.gymbro.common.BaseEntity;
import com.gbatistadev.gymbro.playlist.Playlist;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@NoArgsConstructor
@Table(name = "workout_session")
public class WorkoutSession extends BaseEntity {
    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "ended_at", nullable = false)
    private Instant endedAt;

    @Column(name = "total_volume", precision = 1)
    private Double totalVolume;

    @ManyToOne(optional = false)
    @JoinColumn(name = "playlist_id", nullable = false)
    private Playlist playlist;
}