package com.gbatistadev.gymbro.bioimpedance.job;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
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
    public void reap() {
        try {
            doReap();
        } catch (Exception ex) {
            log.warn("Skipping bioimpedance reaper: DB unavailable ({})", ex.getMessage());
        }
    }

    // shortcut: removed @Transactional to allow outer catch to handle DB-down before tx starts; saveAll is transactional via repository
    private void doReap() {
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
