package com.gbatistadev.gymbro.playlist.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record PlaylistDetailDto(
    UUID id,
    String name,
    String description,
    Instant archivedAt,
    List<PlaylistExerciseDto> exercises
) {}
