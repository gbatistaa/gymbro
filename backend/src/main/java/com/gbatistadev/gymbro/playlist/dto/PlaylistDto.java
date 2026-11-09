package com.gbatistadev.gymbro.playlist.dto;

import java.time.Instant;
import java.util.UUID;

public record PlaylistDto(
    UUID id,
    String name,
    String description,
    Instant archivedAt
) {}
