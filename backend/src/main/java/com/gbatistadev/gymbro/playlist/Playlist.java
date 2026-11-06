package com.gbatistadev.gymbro.playlist;

import com.gbatistadev.gymbro.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Entity
@NoArgsConstructor
@Table(name = "playlists")
public class Playlist extends BaseEntity {
    @Column(nullable = false)
    private String name;
}