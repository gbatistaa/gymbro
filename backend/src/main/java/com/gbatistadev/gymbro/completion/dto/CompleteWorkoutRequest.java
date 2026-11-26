package com.gbatistadev.gymbro.completion.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;

import java.util.List;

/** Corpo opcional do "fiz o treino": sem exercícios, só marca a ficha como feita. */
public record CompleteWorkoutRequest(
    @Valid
    @Size(max = 50, message = "At most 50 exercises can be logged at once")
    List<LoggedExerciseRequest> exercises
) {}
