package com.gbatistadev.gymbro.bioimpedance.dto;

import java.util.UUID;

public record ImportResultItem(
    int index,
    ImportStatus status,
    UUID id,
    String message
) {}
