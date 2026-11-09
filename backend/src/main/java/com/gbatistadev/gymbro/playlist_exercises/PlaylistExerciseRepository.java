package com.gbatistadev.gymbro.playlist_exercises;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PlaylistExerciseRepository
    extends JpaRepository<PlaylistExercise, UUID>, JpaSpecificationExecutor<PlaylistExercise> {

    Optional<PlaylistExercise> findByIdAndPlaylistId(UUID id, UUID playlistId);

    List<PlaylistExercise> findByPlaylistIdOrderByOrderIndexAsc(UUID playlistId);

    boolean existsByExerciseId(UUID exerciseId);

    @Query("""
        SELECT COALESCE(MAX(pe.orderIndex), -1) FROM PlaylistExercise pe
        WHERE pe.playlist.id = :playlistId
    """)
    int maxOrderIndex(@Param("playlistId") UUID playlistId);

    @Query("""
        SELECT pe FROM PlaylistExercise pe
        JOIN FETCH pe.exercise
        WHERE pe.playlist.id = :playlistId
        ORDER BY pe.orderIndex
    """)
    List<PlaylistExercise> findDetailByPlaylistId(@Param("playlistId") UUID playlistId);
}
