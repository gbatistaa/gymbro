package com.gbatistadev.gymbro.bioimpedance.dto;

import com.gbatistadev.gymbro.bioimpedance_logs.enums.ActionType;
import tools.jackson.databind.JsonNode;

import java.time.Instant;
import java.util.UUID;

public record BioimpedanceLogDto(
    UUID id,
    ActionType actionType,
    JsonNode oldData,
    JsonNode newData,
    Instant createdAt
) {}
