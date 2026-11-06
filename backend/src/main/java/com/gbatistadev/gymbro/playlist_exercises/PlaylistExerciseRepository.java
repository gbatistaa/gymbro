package com.gbatistadev.gymbro.playlist_exercises;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.UUID;

public interface PlaylistExerciseRepository extends JpaRepository<PlaylistExercise, UUID>, JpaSpecificationExecutor<PlaylistExercise> {
}