package com.gbatistadev.gymbro.completion.dto;

/** Contagens de treinos feitos. A semana começa na segunda, no fuso do usuário. */
public record CompletionSummaryDto(long totalCount, long thisWeekCount) {}
