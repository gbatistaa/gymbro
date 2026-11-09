package com.gbatistadev.gymbro.playlist;

import com.gbatistadev.gymbro.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Entity
@NoArgsConstructor
@Table(name = "playlists")
public class Playlist extends BaseEntity {
    @Column(nullable = false)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "archived_at")
    private Instant archivedAt;
}