package com.gbatistadev.gymbro.exercise;

import com.gbatistadev.gymbro.exercise.dto.CreateExerciseDto;
import org.springframework.stereotype.Service;

@Service
public class ExerciseService {
    private final ExerciseRepository repository;
    private final ExerciseMapper mapper;

    public ExerciseService(ExerciseRepository repository, ExerciseMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public Exercise createExercise(CreateExerciseDto dto) {

        return repository.save(exercise);
    }
}
