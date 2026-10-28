package com.gbatistadev.gymbro.playlistExercise;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PlaylistExerciseRepository extends JpaRepository<PlaylistExercise, UUID> {
}