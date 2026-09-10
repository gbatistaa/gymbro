package com.gbatistadev.gymbro.playlist_exercises;

public interface PlaylistExerciseRepository extends org.springframework.data.jpa.repository.JpaRepository<com.gbatistadev.gymbro.playlist_exercises.PlaylistExercise, java.util.UUID> ,org.springframework.data.jpa.repository.JpaSpecificationExecutor<com.gbatistadev.gymbro.playlist_exercises.PlaylistExercise> {
}