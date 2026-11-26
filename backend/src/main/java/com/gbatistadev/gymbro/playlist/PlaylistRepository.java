package com.gbatistadev.gymbro.playlist;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PlaylistRepository extends JpaRepository<Playlist, UUID>, JpaSpecificationExecutor<Playlist> {

    Optional<Playlist> findByIdAndUserId(UUID id, UUID userId);

    List<Playlist> findByUserIdAndArchivedAtIsNullOrderByName(UUID userId);

    @Query("""
        SELECT new com.gbatistadev.gymbro.playlist.PlaylistSummaryRow(
            p.id, p.name, p.description, p.archivedAt,
            COUNT(DISTINCT item.id), MAX(completion.completedAt))
        FROM Playlist p
        LEFT JOIN PlaylistExercise item ON item.playlist = p
        LEFT JOIN WorkoutCompletion completion ON completion.playlist = p
        WHERE p.userId = :userId
          AND (:includeArchived = true OR p.archivedAt IS NULL)
        GROUP BY p.id, p.name, p.description, p.archivedAt
        ORDER BY p.name
        """)
    List<PlaylistSummaryRow> findSummariesByUserId(
        @Param("userId") UUID userId,
        @Param("includeArchived") boolean includeArchived);
}
