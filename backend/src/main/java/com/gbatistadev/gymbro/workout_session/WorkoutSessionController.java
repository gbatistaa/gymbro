package com.gbatistadev.gymbro.workout_session;

import com.gbatistadev.gymbro.workout_session.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class WorkoutSessionController {
    private final WorkoutSessionService service;

    @PostMapping
    public ResponseEntity<SessionDto> start(@Valid @RequestBody StartSessionRequest dto) {
        SessionDto session = service.start(dto);

        URI location = ServletUriComponentsBuilder
            .fromCurrentRequest()
            .path("/{id}")
            .buildAndExpand(session.id())
            .toUri();

        return ResponseEntity.created(location).body(session);
    }

    @GetMapping("/active")
    public ResponseEntity<SessionDto> active() {
        Optional<SessionDto> active = service.active();
        return active.map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.noContent().<SessionDto>build());
    }

    @PostMapping("/{id}/logs")
    public ResponseEntity<LogDto> addLog(
        @PathVariable UUID id,
        @Valid @RequestBody AddLogRequest dto
    ) {
        LogResult result = service.addLog(id, dto);
        if (!result.created()) {
            return ResponseEntity.ok(result.log());
        }

        URI location = ServletUriComponentsBuilder
            .fromCurrentRequest()
            .path("/{logId}")
            .buildAndExpand(result.log().id())
            .toUri();

        return ResponseEntity.created(location).body(result.log());
    }

    @DeleteMapping("/{id}/logs/{logId}")
    public ResponseEntity<Void> deleteLog(@PathVariable UUID id, @PathVariable UUID logId) {
        service.deleteLog(id, logId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}")
    public ResponseEntity<SessionDto> finish(
        @PathVariable UUID id,
        @Valid @RequestBody FinishSessionRequest dto
    ) {
        return ResponseEntity.ok(service.finish(id, dto));
    }

    @GetMapping
    public ResponseEntity<PageDto<SessionDto>> list(
        @RequestParam(required = false)
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
        @RequestParam(required = false)
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(service.list(from, to, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SessionDetailDto> detail(@PathVariable UUID id) {
        return ResponseEntity.ok(service.detail(id));
    }
}
