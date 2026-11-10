package com.gbatistadev.gymbro.bioimpedance.job;

import com.gbatistadev.gymbro.bioimpedance.dto.ImportJobDto;
import com.gbatistadev.gymbro.bioimpedance.dto.ImportJobSubmitResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.UUID;

@RestController
@RequestMapping("/api/bioimpedance/imports")
@RequiredArgsConstructor
public class BioimpedanceImportController {
    private final BioimpedanceImportService service;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImportJobDto> upload(@RequestPart("file") MultipartFile file) {
        ImportJobSubmitResult result = service.submit(file);

        if (!result.created()) {
            return ResponseEntity.ok(result.job());
        }

        URI location = ServletUriComponentsBuilder
            .fromCurrentRequest()
            .path("/{id}")
            .buildAndExpand(result.job().id())
            .toUri();

        return ResponseEntity.accepted().location(location).body(result.job());
    }

    @GetMapping("/{jobId}")
    public ResponseEntity<ImportJobDto> get(@PathVariable UUID jobId) {
        return ResponseEntity.ok(service.get(jobId));
    }
}
