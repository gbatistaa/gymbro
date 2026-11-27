package com.gbatistadev.gymbro.progress;

/** Filtros, ordenação e página da lista de progresso, já validados. */
public record ExerciseProgressFilter(
    String search,
    String muscle,
    ExerciseProgressSort sort,
    SortDirection direction,
    int page,
    int size
) {
}
