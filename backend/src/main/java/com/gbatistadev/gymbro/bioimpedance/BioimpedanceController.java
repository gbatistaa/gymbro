package com.gbatistadev.gymbro.bioimpedance;

import com.gbatistadev.gymbro.analytics.BioimpedanceTrendService;
import com.gbatistadev.gymbro.analytics.dto.TrendDto;
import com.gbatistadev.gymbro.bioimpedance.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/bioimpedance")
@RequiredArgsConstructor
public class BioimpedanceController {
    private final BioimpedanceService service;
    private final BioimpedanceTrendService trendService;

    @PostMapping
    public ResponseEntity<BioimpedanceDto> create(
        @Valid @RequestBody CreateBioimpedanceRequest request
    ) {
        BioimpedanceDto created = service.create(request);

        URI location = ServletUriComponentsBuilder
            .fromCurrentRequest()
            .path("/{id}")
            .buildAndExpand(created.id())
            .toUri();

        return ResponseEntity.created(location).body(created);
    }

    @GetMapping
    public ResponseEntity<List<BioimpedanceDto>> list(
        @RequestParam(required = false)
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
        @RequestParam(required = false)
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to
    ) {
        return ResponseEntity.ok(service.list(from, to));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<BioimpedanceDto> update(
        @PathVariable UUID id,
        @Valid @RequestBody UpdateBioimpedanceRequest request
    ) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/trend")
    public ResponseEntity<TrendDto> trend(
        @RequestParam String metric,
        @RequestParam(required = false)
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
        @RequestParam(required = false)
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
        @RequestParam(defaultValue = "7") int window
    ) {
        return ResponseEntity.ok(trendService.trend(metric, from, to, window));
    }

    @PostMapping("/import")
    public ResponseEntity<ImportResponse> importBatch(
        @Valid @RequestBody ImportBioimpedanceRequest request
    ) {
        return ResponseEntity.ok(service.importBatch(request));
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<BioimpedanceLogDto>> history(@PathVariable UUID id) {
        return ResponseEntity.ok(service.history(id));
    }
}
