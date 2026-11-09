package com.gbatistadev.gymbro.playlist.dto;

import java.util.UUID;

public record PlaylistExerciseDto(
    UUID id,
    UUID exerciseId,
    String exerciseName,
    Integer orderIndex,
    Integer targetSets,
    Integer targetRepsMin,
    Integer targetRepsMax,
    Integer restSeconds,
    String note
) {}
