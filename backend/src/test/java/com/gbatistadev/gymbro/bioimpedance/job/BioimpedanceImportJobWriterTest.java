package com.gbatistadev.gymbro.bioimpedance.job;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("BioimpedanceImportJobWriter")
class BioimpedanceImportJobWriterTest {

    @Mock
    private BioimpedanceImportJobRepository repository;

    @InjectMocks
    private BioimpedanceImportJobWriter writer;

    private final UUID jobId = UUID.randomUUID();

    @Test
    @DisplayName("markProcessing moves the job to PROCESSING")
    void shouldMarkProcessing() {
        BioimpedanceImportJob job = job();
        when(repository.findById(jobId)).thenReturn(Optional.of(job));

        writer.markProcessing(jobId);

        assertEquals(ImportJobStatus.PROCESSING, job.getStatus());
        verify(repository).save(job);
    }

    @Test
    @DisplayName("markDone stores the result and the finish time")
    void shouldMarkDone() {
        BioimpedanceImportJob job = job();
        job.setStatus(ImportJobStatus.PROCESSING);
        JsonNode result = JsonMapper.builder().build().createObjectNode().put("bodyFatPercentage", 18.2);
        when(repository.findById(jobId)).thenReturn(Optional.of(job));

        writer.markDone(jobId, result);

        assertEquals(ImportJobStatus.DONE, job.getStatus());
        assertSame(result, job.getResult());
        assertNotNull(job.getFinishedAt());
        verify(repository).save(job);
    }

    @Test
    @DisplayName("markFailed truncates the error to the column size")
    void shouldMarkFailedAndTruncate() {
        BioimpedanceImportJob job = job();
        job.setStatus(ImportJobStatus.PROCESSING);
        when(repository.findById(jobId)).thenReturn(Optional.of(job));

        writer.markFailed(jobId, "x".repeat(1500));

        assertEquals(ImportJobStatus.FAILED, job.getStatus());
        assertEquals(1000, job.getError().length());
        assertNotNull(job.getFinishedAt());
        verify(repository).save(job);
    }

    @Test
    @DisplayName("a terminal job is not resurrected by a late parser response")
    void shouldNotOverwriteTerminalJob() {
        BioimpedanceImportJob job = job();
        job.setStatus(ImportJobStatus.FAILED);
        when(repository.findById(jobId)).thenReturn(Optional.of(job));

        writer.markDone(jobId, JsonMapper.builder().build().createObjectNode());

        assertEquals(ImportJobStatus.FAILED, job.getStatus());
        verify(repository, never()).save(job);
    }

    private BioimpedanceImportJob job() {
        BioimpedanceImportJob job = new BioimpedanceImportJob();
        job.setId(jobId);
        job.setStatus(ImportJobStatus.PENDING);
        return job;
    }
}
