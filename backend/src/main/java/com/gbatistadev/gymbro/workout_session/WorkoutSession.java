package com.gbatistadev.gymbro.workout_session;

import com.gbatistadev.gymbro.common.BaseEntity;
import com.gbatistadev.gymbro.playlist.Playlist;
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
@Table(name = "workout_session")
public class WorkoutSession extends BaseEntity {
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    @Column(name = "total_volume", nullable = false)
    private Double totalVolume = 0.0;

    @ManyToOne
    @JoinColumn(name = "playlist_id")
    private Playlist playlist;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SessionStatus status = SessionStatus.IN_PROGRESS;

    @Column(length = 1000)
    private String notes;

    @Version
    @Column(nullable = false)
    private Long version;
}
