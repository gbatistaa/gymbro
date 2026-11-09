package com.gbatistadev.gymbro.playlist.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record ReorderRequest(
    @NotEmpty(message = "items cannot be empty")
    List<@Valid ReorderItem> items
) {
    public record ReorderItem(
        @NotNull(message = "playlistExerciseId is required")
        UUID playlistExerciseId,

        @NotNull(message = "orderIndex is required")
        @Min(value = 0, message = "orderIndex cannot be negative")
        Integer orderIndex
    ) {}
}
