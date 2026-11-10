package com.gbatistadev.gymbro.bioimpedance.job;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("BioimpedanceImportJobReaper")
class BioimpedanceImportJobReaperTest {

    @Mock
    private BioimpedanceImportJobRepository repository;

    private BioimpedanceImportJobReaper reaper;

    @BeforeEach
    void setUp() {
        reaper = new BioimpedanceImportJobReaper(
            repository,
            new BioimpedanceImportProperties(Duration.ofMinutes(3)));
    }

    @Test
    @DisplayName("stale PROCESSING jobs are marked FAILED")
    void shouldFailStaleProcessingJobs() {
        BioimpedanceImportJob job = new BioimpedanceImportJob();
        job.setStatus(ImportJobStatus.PROCESSING);
        when(repository.findByStatusAndUpdatedAtBefore(eq(ImportJobStatus.PROCESSING), any(Instant.class)))
            .thenReturn(List.of(job));

        reaper.reap();

        assertEquals(ImportJobStatus.FAILED, job.getStatus());
        assertEquals("processing interrupted", job.getError());
        assertNotNull(job.getFinishedAt());
        verify(repository).saveAll(List.of(job));
    }

    @Test
    @DisplayName("nothing happens when there are no stale jobs")
    void shouldDoNothingWhenNoStaleJobs() {
        when(repository.findByStatusAndUpdatedAtBefore(eq(ImportJobStatus.PROCESSING), any(Instant.class)))
            .thenReturn(List.of());

        reaper.reap();

        verify(repository, never()).saveAll(any());
    }
}
