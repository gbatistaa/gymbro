package com.gbatistadev.gymbro.exercise;

import com.gbatistadev.gymbro.common.dto.PageDto;
import com.gbatistadev.gymbro.exercise.dto.CreateExerciseDto;
import com.gbatistadev.gymbro.exercise.dto.ExerciseDto;
import com.gbatistadev.gymbro.exercise.dto.UpdateExerciseDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.UUID;

@RestController
@RequestMapping("/api/exercises")
@RequiredArgsConstructor
public class ExerciseController {
    private final ExerciseService service;

    @PostMapping
    public ResponseEntity<ExerciseDto> create(@Valid @RequestBody CreateExerciseDto dto) {
        ExerciseDto exercise = service.create(dto);

        URI location = ServletUriComponentsBuilder
            .fromCurrentRequest()
            .path("/{id}")
            .buildAndExpand(exercise.getId())
            .toUri();

        return ResponseEntity.created(location).body(exercise);
    }

    @GetMapping
    public ResponseEntity<PageDto<ExerciseDto>> search(
        @RequestParam(required = false) String q,
        @RequestParam(required = false) String muscle,
        @RequestParam(defaultValue = "false") boolean includeArchived,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(service.search(q, muscle, includeArchived, page, size));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExerciseDto> update(
        @Valid @RequestBody UpdateExerciseDto dto,
        @PathVariable UUID id
    ) {
        ExerciseDto updated = service.update(dto, id);

        URI location = ServletUriComponentsBuilder
            .fromCurrentRequest()
            .path("/{id}")
            .buildAndExpand(updated.getId())
            .toUri();

        return ResponseEntity.ok().location(location).body(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> archive(@PathVariable UUID id) {
        service.archive(id);
        return ResponseEntity.noContent().build();
    }
}
