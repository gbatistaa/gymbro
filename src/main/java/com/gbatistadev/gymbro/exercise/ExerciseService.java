package com.gbatistadev.gymbro.exercise;

import com.gbatistadev.gymbro.errors.exceptions.NotFoundException;
import com.gbatistadev.gymbro.errors.exceptions.ResourceAlreadyExistsException;
import com.gbatistadev.gymbro.exercise.dto.CreateExerciseDto;
import com.gbatistadev.gymbro.exercise.dto.ExerciseDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

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
		if (repository.existsExerciseNameDuplicate(dto.name())) {
			throw new ResourceAlreadyExistsException("An exercise with that name already exists");
		}

        Exercise exercise = mapper.toEntity(dto);
		exercise.setName(capitalize(exercise.getName()));
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
	public void updateExercise(CreateExerciseDto dto, UUID id) {
		Exercise entity = repository.findById(id)
			.orElseThrow(() -> new NotFoundException("Rebolou lentinho pros crias"));


	}

	private String capitalize(String text) {
		List<String> splited = List.of(text.split(" "));

		return splited.stream().map((word) -> {
			StringBuilder wordBuilder = new StringBuilder(word);

			for (int i = 0; i < word.length(); i++) {
				String letter = String.valueOf(wordBuilder.charAt(0));
				if (i == 0) {
					wordBuilder.setCharAt(i, letter.toUpperCase(Locale.ROOT).toCharArray()[0]);
				} else {
					wordBuilder.setCharAt(i, letter.toLowerCase(Locale.ROOT).toCharArray()[0]);
				}
			}
			return wordBuilder;
		}).toString();
	}
}
