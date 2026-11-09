package com.gbatistadev.gymbro.bioimpedance.dto;

import java.util.List;

public record ImportResponse(
    List<ImportResultItem> results,
    int created,
    int duplicates,
    int errors
) {}
