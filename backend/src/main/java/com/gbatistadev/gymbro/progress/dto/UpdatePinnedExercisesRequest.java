package com.gbatistadev.gymbro.progress.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

/** Lista completa e ordenada dos exercícios fixados; vazia solta todos. */
public record UpdatePinnedExercisesRequest(
    @NotNull
    @Size(max = PinnedExerciseLimits.MAX_PINNED, message = "pin at most 4 exercises")
    List<@NotNull UUID> exerciseIds
) {
}
