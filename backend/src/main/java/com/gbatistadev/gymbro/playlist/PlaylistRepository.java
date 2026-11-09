package com.gbatistadev.gymbro.playlist;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PlaylistRepository extends JpaRepository<Playlist, UUID>, JpaSpecificationExecutor<Playlist> {

    Optional<Playlist> findByIdAndUserId(UUID id, UUID userId);

    List<Playlist> findByUserIdAndArchivedAtIsNullOrderByName(UUID userId);

    List<Playlist> findByUserIdOrderByName(UUID userId);
}
