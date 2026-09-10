package com.gbatistadev.gymbro.workout_session;

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

    @Column(name = "total_volume", nullable = false, precision = 1)
    private Double totalVolume;

    @ManyToOne(optional = false)
    @JoinColumn(name = "playlist_id", nullable = true)
    private Playlist playlist;
}