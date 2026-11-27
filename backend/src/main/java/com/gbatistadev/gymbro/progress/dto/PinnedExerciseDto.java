package com.gbatistadev.gymbro.progress.dto;

import java.util.UUID;

public record PinnedExerciseDto(UUID exerciseId, String name, String primaryMuscle, int position) {
}
