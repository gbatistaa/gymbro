package com.gbatistadev.gymbro.playlist.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreatePlaylistRequest(
    @NotBlank(message = "Name is required")
    @Size(max = 120, message = "Name must have at most 120 characters")
    String name,

    @Size(max = 500, message = "Description must have at most 500 characters")
    String description
) {}
