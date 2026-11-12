package com.gbatistadev.gymbro.playlist;

import com.gbatistadev.gymbro.playlist.dto.PlaylistSummaryDto;
import com.gbatistadev.gymbro.workout_session.SessionStatus;
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
        SELECT new com.gbatistadev.gymbro.playlist.dto.PlaylistSummaryDto(
            p.id, p.name, p.description, p.archivedAt,
            COUNT(DISTINCT item.id), MAX(session.startedAt))
        FROM Playlist p
        LEFT JOIN PlaylistExercise item ON item.playlist = p
        LEFT JOIN WorkoutSession session
            ON session.playlist = p AND session.status = :finishedStatus
        WHERE p.userId = :userId
          AND (:includeArchived = true OR p.archivedAt IS NULL)
        GROUP BY p.id, p.name, p.description, p.archivedAt
        ORDER BY p.name
        """)
    List<PlaylistSummaryDto> findSummariesByUserId(
        @Param("userId") UUID userId,
        @Param("includeArchived") boolean includeArchived,
        @Param("finishedStatus") SessionStatus finishedStatus);
}
