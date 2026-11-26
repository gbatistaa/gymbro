package com.gbatistadev.gymbro.playlist.dto;

import java.util.List;
import java.util.UUID;

public record PlaylistDetailDto(
    UUID id,
    String name,
    String description,
    List<PlaylistExerciseDto> exercises
) {}
