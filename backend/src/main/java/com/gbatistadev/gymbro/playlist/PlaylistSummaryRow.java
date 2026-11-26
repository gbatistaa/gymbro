package com.gbatistadev.gymbro.playlist;

import java.time.Instant;
import java.util.UUID;

/** Agregado por ficha calculado no banco; a prévia dos exercícios é anexada no serviço. */
public record PlaylistSummaryRow(
    UUID id,
    String name,
    String description,
    Instant archivedAt,
    long exerciseCount,
    Instant lastPerformedAt
) {}
