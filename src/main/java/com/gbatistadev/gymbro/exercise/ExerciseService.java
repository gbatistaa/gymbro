package com.gbatistadev.gymbro.exercise;

import com.gbatistadev.gymbro.exercise.dto.CreateExerciseDto;
import com.gbatistadev.gymbro.exercise.dto.ExerciseDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ExerciseService {
    private final ExerciseRepository repository;
    private final ExerciseMapper mapper;

    public ExerciseService(ExerciseRepository repository, ExerciseMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Transactional
    public ExerciseDto create(CreateExerciseDto dto) {
		if (repository.existsExerciseNameDuplicate(dto.name())) {
			throw new
		}

        Exercise exercise = mapper.toEntity(dto);
        repository.save(exercise);

        return mapper.toDto(exercise);
    }

    @Transactional(readOnly = true)
    public List<ExerciseDto> findAll() {
		return repository
			.findAll()
			.stream()
			.map(mapper::toDto).toList();
    }
}
