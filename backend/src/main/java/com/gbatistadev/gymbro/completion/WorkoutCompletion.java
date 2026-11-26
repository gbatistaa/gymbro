package com.gbatistadev.gymbro.completion;

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
@Table(name = "workout_completion")
public class WorkoutCompletion extends BaseEntity {
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "playlist_id", nullable = false)
    private Playlist playlist;

    @Column(name = "completed_at", nullable = false)
    private Instant completedAt;
}
