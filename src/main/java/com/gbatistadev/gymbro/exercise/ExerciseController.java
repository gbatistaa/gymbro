package com.gbatistadev.gymbro.exercise;

import com.gbatistadev.gymbro.exercise.dto.CreateExerciseDto;
import com.gbatistadev.gymbro.exercise.dto.ExerciseDto;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/exercises")
public class ExerciseController {
    private final ExerciseService service;

    public ExerciseController(ExerciseService service) {
        this.service = service;
    }

    public ExerciseDto createExercise(CreateExerciseDto dto) {
        return null;
    }
}
