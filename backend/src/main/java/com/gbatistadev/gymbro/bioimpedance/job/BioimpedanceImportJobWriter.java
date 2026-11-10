package com.gbatistadev.gymbro.bioimpedance.job;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BioimpedanceImportJobWriter {
    private final BioimpedanceImportJobRepository repository;

    @Transactional
    public void markProcessing(UUID jobId) {
        repository.findById(jobId).ifPresent(job -> {
            job.setStatus(ImportJobStatus.PROCESSING);
            job.setError(null);
            repository.save(job);
        });
    }

    @Transactional
    public void markDone(UUID jobId, JsonNode result) {
        repository.findById(jobId).ifPresent(job -> {
            if (job.getStatus() != ImportJobStatus.PROCESSING) {
                return;
            }
            job.setStatus(ImportJobStatus.DONE);
            job.setResult(result);
            job.setError(null);
            job.setFinishedAt(Instant.now());
            repository.save(job);
        });
    }

    @Transactional
    public void markFailed(UUID jobId, String error) {
        repository.findById(jobId).ifPresent(job -> {
            if (job.getStatus() != ImportJobStatus.PROCESSING) {
                return;
            }
            job.setStatus(ImportJobStatus.FAILED);
            job.setError(truncate(error));
            job.setFinishedAt(Instant.now());
            repository.save(job);
        });
    }

    private String truncate(String error) {
        String message = error == null || error.isBlank() ? "Extraction failed" : error;
        return message.length() <= 1000 ? message : message.substring(0, 1000);
    }
}
