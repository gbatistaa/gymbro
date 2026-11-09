package com.gbatistadev.gymbro.workout_session.dto;

import com.gbatistadev.gymbro.workout_session.SessionStatus;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record SessionDetailDto(
    UUID id,
    UUID playlistId,
    SessionStatus status,
    Instant startedAt,
    Instant endedAt,
    Double totalVolume,
    String notes,
    List<ExerciseLogsDto> exercises
) {}
