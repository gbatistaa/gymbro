package com.gbatistadev.gymbro.playlist.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record UpdatePlaylistExerciseRequest(
    @Min(value = 1, message = "targetSets must be at least 1")
    @Max(value = 20, message = "targetSets must be at most 20")
    Integer targetSets,

    @Min(value = 1, message = "targetRepsMin must be at least 1")
    Integer targetRepsMin,

    @Min(value = 1, message = "targetRepsMax must be at least 1")
    Integer targetRepsMax,

    @Min(value = 0, message = "restSeconds cannot be negative")
    @Max(value = 600, message = "restSeconds must be at most 600")
    Integer restSeconds,

    @Size(max = 500, message = "note must have at most 500 characters")
    String note
) {}
