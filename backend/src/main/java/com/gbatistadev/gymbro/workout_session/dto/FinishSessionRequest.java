package com.gbatistadev.gymbro.workout_session.dto;

import com.gbatistadev.gymbro.workout_session.SessionStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record FinishSessionRequest(
    @NotNull(message = "status is required")
    SessionStatus status,

    @Size(max = 1000, message = "notes must have at most 1000 characters")
    String notes
) {}
