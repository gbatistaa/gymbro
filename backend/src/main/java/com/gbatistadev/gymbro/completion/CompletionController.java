package com.gbatistadev.gymbro.completion;

import com.gbatistadev.gymbro.completion.dto.CompleteWorkoutRequest;
import com.gbatistadev.gymbro.completion.dto.CompletionDto;
import com.gbatistadev.gymbro.completion.dto.CompletionSummaryDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.UUID;

/** Sem prefixo de classe: a marcação "fiz" nasce na rota da rotina, o resto fica em /api/completions. */
@RestController
@RequiredArgsConstructor
public class CompletionController {
    private final CompletionService service;

    @PostMapping("/api/playlists/{playlistId}/completions")
    public ResponseEntity<CompletionDto> complete(
        @PathVariable UUID playlistId,
        @Valid @RequestBody(required = false) CompleteWorkoutRequest request
    ) {
        CompletionDto completion = service.complete(playlistId, request);

        URI location = ServletUriComponentsBuilder
            .fromCurrentContextPath()
            .path("/api/completions/{id}")
            .buildAndExpand(completion.id())
            .toUri();

        return ResponseEntity.created(location).body(completion);
    }

    @GetMapping("/api/completions")
    public List<CompletionDto> recent(@RequestParam(defaultValue = "10") int size) {
        return service.recent(size);
    }

    @GetMapping("/api/completions/summary")
    public CompletionSummaryDto summary() {
        return service.summary();
    }

    @DeleteMapping("/api/completions/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }
}
