package com.gbatistadev.gymbro.workout_session.dto;

import jakarta.validation.constraints.PastOrPresent;

import java.time.Instant;
import java.util.UUID;

public record StartSessionRequest(
    UUID playlistId,
    @PastOrPresent(message = "startedAt cannot be in the future")
    Instant startedAt
) {}
