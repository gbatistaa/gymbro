package com.gbatistadev.gymbro.playlist;

import com.gbatistadev.gymbro.analytics.ProgressionService;
import com.gbatistadev.gymbro.analytics.dto.NextTargetDto;
import com.gbatistadev.gymbro.playlist.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/playlists")
@RequiredArgsConstructor
public class PlaylistController {
    private final PlaylistService service;
    private final ProgressionService progressionService;

    @GetMapping
    public ResponseEntity<List<PlaylistDto>> list(
        @RequestParam(defaultValue = "false") boolean includeArchived
    ) {
        return ResponseEntity.ok(service.list(includeArchived));
    }

    @PostMapping
    public ResponseEntity<PlaylistDto> create(@Valid @RequestBody CreatePlaylistRequest request) {
        PlaylistDto playlist = service.create(request);

        URI location = ServletUriComponentsBuilder
            .fromCurrentRequest()
            .path("/{id}")
            .buildAndExpand(playlist.id())
            .toUri();

        return ResponseEntity.created(location).body(playlist);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlaylistDetailDto> detail(@PathVariable UUID id) {
        return ResponseEntity.ok(service.detail(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PlaylistDto> update(
        @PathVariable UUID id,
        @Valid @RequestBody UpdatePlaylistRequest request
    ) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @PostMapping("/{id}/clone")
    public ResponseEntity<PlaylistDto> clone(@PathVariable UUID id) {
        PlaylistDto clone = service.clone(id);

        URI location = ServletUriComponentsBuilder
            .fromCurrentRequest()
            .path("/{id}")
            .buildAndExpand(clone.id())
            .toUri();

        return ResponseEntity.created(location).body(clone);
    }

    @PostMapping("/{id}/archive")
    public ResponseEntity<PlaylistDto> archive(@PathVariable UUID id) {
        return ResponseEntity.ok(service.archive(id));
    }

    @PostMapping("/{id}/exercises")
    public ResponseEntity<PlaylistExerciseDto> addExercise(
        @PathVariable UUID id,
        @Valid @RequestBody AddPlaylistExerciseRequest request
    ) {
        PlaylistExerciseDto item = service.addExercise(id, request);

        URI location = ServletUriComponentsBuilder
            .fromCurrentRequest()
            .path("/{itemId}")
            .buildAndExpand(item.id())
            .toUri();

        return ResponseEntity.created(location).body(item);
    }

    @PatchMapping("/{id}/exercises/{itemId}")
    public ResponseEntity<PlaylistExerciseDto> updateExercise(
        @PathVariable UUID id,
        @PathVariable UUID itemId,
        @Valid @RequestBody UpdatePlaylistExerciseRequest request
    ) {
        return ResponseEntity.ok(service.updateExercise(id, itemId, request));
    }

    @DeleteMapping("/{id}/exercises/{itemId}")
    public ResponseEntity<Void> removeExercise(
        @PathVariable UUID id,
        @PathVariable UUID itemId
    ) {
        service.removeExercise(id, itemId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/next-targets")
    public ResponseEntity<List<NextTargetDto>> nextTargets(@PathVariable UUID id) {
        return ResponseEntity.ok(progressionService.nextTargets(id));
    }

    @PutMapping("/{id}/order")
    public ResponseEntity<PlaylistDetailDto> reorder(
        @PathVariable UUID id,
        @Valid @RequestBody ReorderRequest request
    ) {
        return ResponseEntity.ok(service.reorder(id, request));
    }
}
