package com.gbatistadev.gymbro.bioimpedance.dto;

import com.gbatistadev.gymbro.bioimpedance.job.ImportJobStatus;
import tools.jackson.databind.JsonNode;

import java.time.Instant;
import java.util.UUID;

/**
 * {@code bioimpedanceId} stays {@code null} while the import is open; it points to the
 * measurement once the user confirms the reviewed values.
 */
public record ImportJobDto(
    UUID id,
    ImportJobStatus status,
    String sourceFileName,
    String sourceFileHash,
    JsonNode result,
    String error,
    Instant createdAt,
    Instant finishedAt,
    UUID bioimpedanceId
) {}
