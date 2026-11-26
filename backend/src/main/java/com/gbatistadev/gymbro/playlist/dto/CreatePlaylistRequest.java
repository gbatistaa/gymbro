package com.gbatistadev.gymbro.playlist.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

/** {@code exercises} é opcional: a ficha pode nascer vazia ou já com os exercícios, na ordem enviada. */
public record CreatePlaylistRequest(
    @NotBlank(message = "Name is required")
    @Size(max = 120, message = "Name must have at most 120 characters")
    String name,

    @Size(max = 500, message = "Description must have at most 500 characters")
    String description,

    @Valid
    @Size(max = 50, message = "A plan can have at most 50 exercises")
    List<AddPlaylistExerciseRequest> exercises
) {}
