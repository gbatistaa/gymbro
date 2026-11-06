package com.gbatistadev.gymbro.exercise;

import com.gbatistadev.gymbro.common.aspect.Logging;
import com.gbatistadev.gymbro.errors.exceptions.NotFoundException;
import com.gbatistadev.gymbro.errors.exceptions.ResourceAlreadyExistsException;
import com.gbatistadev.gymbro.exercise.dto.CreateExerciseDto;
import com.gbatistadev.gymbro.exercise.dto.ExerciseDto;
import com.gbatistadev.gymbro.exercise.dto.UpdateExerciseDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class ExerciseService {
    private final ExerciseRepository repository;
    private final ExerciseMapper mapper;

    public ExerciseService(ExerciseRepository repository, ExerciseMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Transactional
    public ExerciseDto create(CreateExerciseDto dto) throws ResourceAlreadyExistsException {
		String name = capitalize(dto.name());
		if (repository.existsExerciseNameDuplicate(name)) {
			throw new ResourceAlreadyExistsException("An exercise with that name already exists");
		}

        Exercise exercise = mapper.toEntity(dto);
		exercise.setName(name);
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

	@Transactional
	@Logging(action = "UPDATE")
	public ExerciseDto update(UpdateExerciseDto dto, UUID id) {
		Exercise entity = repository.findById(id)
			.orElseThrow(() -> new NotFoundException(
				"Exercise not found: " + id
			));

		mapper.updateEntity(dto, entity);

		return mapper.toDto(entity);
	}

	private String capitalize(String text) {
		return Stream.of(text.split(" "))
			.map(word -> word.isEmpty() ? word
				: word.substring(0, 1).toUpperCase(Locale.ROOT) + word.substring(1).toLowerCase(Locale.ROOT))
			.collect(Collectors.joining(" "));
	}
}
