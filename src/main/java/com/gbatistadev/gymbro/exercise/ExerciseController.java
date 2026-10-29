package com.gbatistadev.gymbro.exercise;

import com.gbatistadev.gymbro.exercise.dto.CreateExerciseDto;
import com.gbatistadev.gymbro.exercise.dto.ExerciseDto;
import com.gbatistadev.gymbro.exercise.dto.UpdateExerciseDto;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@RestController
@RequestMapping("/api/exercises")
public class ExerciseController {
    private final ExerciseService service;

    public ExerciseController(ExerciseMapper exerciseMapper, ExerciseService service) {
		this.service = service;
    }

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
    public ResponseEntity<List<ExerciseDto>> findAll(Locale locale) {
        List<ExerciseDto> exerciseDtos = service.findAll();

        URI location = ServletUriComponentsBuilder
            .fromCurrentRequest()
            .build()
            .toUri();

        return ResponseEntity.ok().location(location).body(exerciseDtos);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExerciseDto> update(@Valid @RequestBody UpdateExerciseDto dto, @PathVariable UUID id) {
		ExerciseDto updated = service.update(dto, id);

        URI location = ServletUriComponentsBuilder
            .fromCurrentRequest()
            .path("/{id}")
            .buildAndExpand(updated.getId())
            .toUri();

        return ResponseEntity.ok().location(location).body(updated);
    }
}
