package com.gbatistadev.gymbro.playlist.dto;

import java.time.Instant;
import java.util.UUID;

public record PlaylistSummaryDto(
    UUID id,
    String name,
    String description,
    Instant archivedAt,
    long exerciseCount,
    Instant lastPerformedAt
) {}
