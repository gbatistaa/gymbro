package com.gbatistadev.gymbro.completion.dto;

import java.time.Instant;
import java.util.UUID;

public record CompletionDto(UUID id, UUID playlistId, String playlistName, Instant completedAt) {}
