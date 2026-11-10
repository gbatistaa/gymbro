package com.gbatistadev.gymbro.bioimpedance.job;

import com.gbatistadev.gymbro.bioimpedance.parser.BioimpedanceParser;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("BioimpedanceExtractionProcessor")
class BioimpedanceExtractionProcessorTest {

    @Mock
    private BioimpedanceParser parser;

    @Mock
    private BioimpedanceImportJobWriter writer;

    @InjectMocks
    private BioimpedanceExtractionProcessor processor;

    private final UUID jobId = UUID.randomUUID();
    private final byte[] file = "%PDF-1.4".getBytes();

    @Test
    @DisplayName("successful extraction marks the job DONE")
    void shouldMarkDoneOnSuccess() {
        JsonNode result = JsonMapper.builder().build().createObjectNode();
        when(parser.extract(file, "inbody.pdf")).thenReturn(result);

        processor.process(jobId, file, "inbody.pdf");

        verify(writer).markProcessing(jobId);
        verify(writer).markDone(jobId, result);
        verify(writer, never()).markFailed(any(), any());
    }

    @Test
    @DisplayName("parser failure marks the job FAILED")
    void shouldMarkFailedOnError() {
        when(parser.extract(file, "inbody.pdf"))
            .thenThrow(new IllegalStateException("parser down"));

        processor.process(jobId, file, "inbody.pdf");

        verify(writer).markProcessing(jobId);
        verify(writer).markFailed(jobId, "parser down");
        verify(writer, never()).markDone(any(), any());
    }
}
