package com.gbatistadev.gymbro.bioimpedance.job;

import com.gbatistadev.gymbro.bioimpedance.dto.ImportJobDto;
import com.gbatistadev.gymbro.bioimpedance.dto.ImportJobSubmitResult;
import com.gbatistadev.gymbro.common.security.CurrentUser;
import com.gbatistadev.gymbro.errors.exceptions.BadRequestException;
import com.gbatistadev.gymbro.errors.exceptions.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BioimpedanceImportService {
    private static final int MAX_FILE_BYTES = 10 * 1024 * 1024;
    private static final List<ImportJobStatus> ACTIVE_STATUSES =
        List.of(ImportJobStatus.PENDING, ImportJobStatus.PROCESSING, ImportJobStatus.DONE);

    private final BioimpedanceImportJobRepository repository;
    private final BioimpedanceImportJobMapper mapper;
    private final BioimpedanceExtractionProcessor processor;
    private final CurrentUser currentUser;

    public ImportJobSubmitResult submit(MultipartFile file) {
        byte[] bytes = readPdf(file);
        String hash = sha256Hex(bytes);
        UUID userId = currentUser.id();

        Optional<BioimpedanceImportJob> existing = repository
            .findFirstByUserIdAndSourceFileHashAndStatusInOrderByCreatedAtDesc(
                userId, hash, ACTIVE_STATUSES);
        if (existing.isPresent()) {
            return new ImportJobSubmitResult(mapper.toDto(existing.get()), false);
        }

        BioimpedanceImportJob job = new BioimpedanceImportJob();
        job.setUserId(userId);
        job.setStatus(ImportJobStatus.PENDING);
        job.setSourceFileName(fileName(file));
        job.setSourceFileHash(hash);
        repository.save(job);

        // save() commits before returning, so the async worker always sees the row
        processor.process(job.getId(), bytes, job.getSourceFileName());

        // shortcut: a crash between PROCESSING and DONE leaves the job stuck; add a reaper
        // when extraction runs unattended. Re-uploading the same file returns the stuck job.
        BioimpedanceImportJob current = repository.findById(job.getId()).orElse(job);
        return new ImportJobSubmitResult(mapper.toDto(current), true);
    }

    public ImportJobDto get(UUID jobId) {
        return repository.findByIdAndUserId(jobId, currentUser.id())
            .map(mapper::toDto)
            .orElseThrow(() -> new NotFoundException("Import job not found: " + jobId));
    }

    private byte[] readPdf(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("file is required");
        }
        if (file.getSize() > MAX_FILE_BYTES) {
            throw new BadRequestException("file must be at most 10 MB");
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new BadRequestException("Could not read the uploaded file");
        }

        String magic = bytes.length >= 5
            ? new String(bytes, 0, 5, StandardCharsets.ISO_8859_1)
            : "";
        if (!"%PDF-".equals(magic)) {
            throw new BadRequestException("file must be a PDF");
        }
        return bytes;
    }

    private String fileName(MultipartFile file) {
        String name = file.getOriginalFilename();
        if (name == null || name.isBlank()) {
            return "upload.pdf";
        }
        return name.length() <= 255 ? name : name.substring(0, 255);
    }

    private String sha256Hex(byte[] bytes) {
        try {
            return HexFormat.of().formatHex(
                MessageDigest.getInstance("SHA-256").digest(bytes));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
