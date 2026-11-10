package com.gbatistadev.gymbro.bioimpedance.job;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor
public class BioimpedanceImportJobReaper {
    private final BioimpedanceImportJobRepository repository;
    private final BioimpedanceImportProperties properties;

    @EventListener(ApplicationReadyEvent.class)
    @Scheduled(fixedDelayString = "${bioimpedance.import.reaper-interval-ms:300000}")
    @Transactional
    public void reap() {
        Instant cutoff = Instant.now().minus(properties.staleAfter());
        List<BioimpedanceImportJob> stale = repository
            .findByStatusAndUpdatedAtBefore(ImportJobStatus.PROCESSING, cutoff);

        if (stale.isEmpty()) {
            return;
        }

        Instant now = Instant.now();
        for (BioimpedanceImportJob job : stale) {
            job.setStatus(ImportJobStatus.FAILED);
            job.setError("processing interrupted");
            job.setFinishedAt(now);
        }
        repository.saveAll(stale);
        log.warn("Marked {} stale bioimpedance import jobs as FAILED", stale.size());
    }
}
