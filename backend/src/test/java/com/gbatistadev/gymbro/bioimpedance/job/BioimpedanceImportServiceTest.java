package com.gbatistadev.gymbro.bioimpedance.job;

import com.gbatistadev.gymbro.bioimpedance.dto.ImportJobDto;
import com.gbatistadev.gymbro.bioimpedance.dto.ImportJobSubmitResult;
import com.gbatistadev.gymbro.common.security.CurrentUser;
import com.gbatistadev.gymbro.errors.exceptions.BadRequestException;
import com.gbatistadev.gymbro.errors.exceptions.NotFoundException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("BioimpedanceImportService")
class BioimpedanceImportServiceTest {

    @Mock
    private BioimpedanceImportJobRepository repository;

    @Mock
    private BioimpedanceImportJobMapper mapper;

    @Mock
    private BioimpedanceExtractionProcessor processor;

    @Mock
    private CurrentUser currentUser;

    @InjectMocks
    private BioimpedanceImportService service;

    private final UUID userId = UUID.randomUUID();
    private final UUID jobId = UUID.randomUUID();

    @Test
    @DisplayName("submit stores a PENDING job with the file hash and dispatches processing")
    void shouldSubmitJob() {
        MockMultipartFile file = pdfFile();
        AtomicReference<BioimpedanceImportJob> saved = new AtomicReference<>();

        when(currentUser.id()).thenReturn(userId);
        when(repository.findFirstByUserIdAndSourceFileHashAndStatusInOrderByCreatedAtDesc(
            eq(userId), anyString(), anyList())).thenReturn(Optional.empty());
        when(repository.save(any(BioimpedanceImportJob.class))).thenAnswer(invocation -> {
            BioimpedanceImportJob job = invocation.getArgument(0);
            job.setId(jobId);
            saved.set(job);
            return job;
        });
        when(repository.findById(jobId)).thenAnswer(invocation -> Optional.of(saved.get()));
        when(mapper.toDto(any(BioimpedanceImportJob.class)))
            .thenReturn(new ImportJobDto(jobId, ImportJobStatus.PENDING, "inbody.pdf",
                "hash", null, null, null, null));

        ImportJobSubmitResult result = service.submit(file);

        assertTrue(result.created());
        assertEquals(userId, saved.get().getUserId());
        assertEquals(ImportJobStatus.PENDING, saved.get().getStatus());
        assertEquals("inbody.pdf", saved.get().getSourceFileName());
        assertEquals(64, saved.get().getSourceFileHash().length());

        verify(processor).process(eq(jobId), any(byte[].class), eq("inbody.pdf"));
    }

    @Test
    @DisplayName("submitting the same file returns the existing active job")
    void shouldReuseExistingJob() {
        MockMultipartFile file = pdfFile();
        BioimpedanceImportJob existing = new BioimpedanceImportJob();
        existing.setId(jobId);
        existing.setStatus(ImportJobStatus.DONE);
        ImportJobDto dto = new ImportJobDto(jobId, ImportJobStatus.DONE, "inbody.pdf",
            "hash", null, null, null, null);

        when(currentUser.id()).thenReturn(userId);
        when(repository.findFirstByUserIdAndSourceFileHashAndStatusInOrderByCreatedAtDesc(
            eq(userId), anyString(), anyList())).thenReturn(Optional.of(existing));
        when(mapper.toDto(existing)).thenReturn(dto);

        ImportJobSubmitResult result = service.submit(file);

        assertFalse(result.created());
        assertSame(dto, result.job());
        verify(repository, never()).save(any());
        verifyNoInteractions(processor);
    }

    @Test
    @DisplayName("submit rejects a file that is not a PDF")
    void shouldRejectNonPdf() {
        MockMultipartFile file = new MockMultipartFile(
            "file", "not-a-pdf.txt", "text/plain",
            "hello".getBytes(StandardCharsets.UTF_8));

        assertThrows(BadRequestException.class, () -> service.submit(file));
        verifyNoInteractions(repository, processor, currentUser);
    }

    @Test
    @DisplayName("submit rejects an empty file")
    void shouldRejectEmptyFile() {
        MockMultipartFile file = new MockMultipartFile(
            "file", "empty.pdf", "application/pdf", new byte[0]);

        assertThrows(BadRequestException.class, () -> service.submit(file));
        verifyNoInteractions(repository, processor, currentUser);
    }

    @Test
    @DisplayName("submit rejects a file larger than 10 MB")
    void shouldRejectOversizedFile() {
        byte[] bytes = new byte[10 * 1024 * 1024 + 1];
        System.arraycopy("%PDF-".getBytes(StandardCharsets.ISO_8859_1), 0, bytes, 0, 5);
        MockMultipartFile file = new MockMultipartFile(
            "file", "huge.pdf", "application/pdf", bytes);

        assertThrows(BadRequestException.class, () -> service.submit(file));
        verifyNoInteractions(repository, processor, currentUser);
    }

    @Test
    @DisplayName("get hides a job owned by another user")
    void shouldHideForeignJob() {
        when(currentUser.id()).thenReturn(userId);
        when(repository.findByIdAndUserId(jobId, userId)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> service.get(jobId));
    }

    private MockMultipartFile pdfFile() {
        return new MockMultipartFile(
            "file",
            "inbody.pdf",
            "application/pdf",
            "%PDF-1.4 fake content".getBytes(StandardCharsets.ISO_8859_1));
    }
}
