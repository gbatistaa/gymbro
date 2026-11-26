package com.gbatistadev.gymbro.playlist.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Linha da lista de fichas, com a prévia dos exercícios para o card. */
public record PlaylistSummaryDto(
    UUID id,
    String name,
    String description,
    long exerciseCount,
    Instant lastPerformedAt,
    List<PlaylistExerciseDto> exercises
) {}
