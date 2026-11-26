package com.gbatistadev.gymbro.bioimpedance.parser;

import tools.jackson.databind.JsonNode;

/**
 * Contract with the Python sidecar. It receives the raw PDF and returns a normalized
 * JSON object; unidentified fields must be present as null, plus a {@code missingFields}
 * array. {@code measuredAt} is kept as printed in the report ({@code YYYY-MM-DD} or a local
 * date-time without offset) because reports rarely state a time zone; the client resolves it in
 * the user's time zone. The backend stores this as a preview; persistence still happens through
 * the import endpoint after user confirmation.
 */
public interface BioimpedanceParser {

    JsonNode extract(byte[] file, String fileName);
}
