package com.gbatistadev.gymbro.bioimpedance.job;

import com.gbatistadev.gymbro.bioimpedance.parser.BioimpedanceParser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;

import java.util.UUID;

@Component
@Slf4j
@RequiredArgsConstructor
public class BioimpedanceExtractionProcessor {
    private final BioimpedanceParser parser;
    private final BioimpedanceImportJobWriter writer;

    @Async
    public void process(UUID jobId, byte[] file, String fileName) {
        writer.markProcessing(jobId);

        try {
            JsonNode result = parser.extract(file, fileName);
            writer.markDone(jobId, result);
        } catch (Exception e) {
            log.warn("Bioimpedance extraction failed for job {}", jobId, e);
            writer.markFailed(jobId, e.getMessage());
        }
    }
}
