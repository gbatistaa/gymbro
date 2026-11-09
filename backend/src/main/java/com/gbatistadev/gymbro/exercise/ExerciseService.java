package com.gbatistadev.gymbro.exercise;

import com.gbatistadev.gymbro.common.aspect.Logging;
import com.gbatistadev.gymbro.common.dto.PageDto;
import com.gbatistadev.gymbro.common.security.CurrentUser;
import com.gbatistadev.gymbro.errors.exceptions.ConflictException;
import com.gbatistadev.gymbro.errors.exceptions.ForbiddenException;
import com.gbatistadev.gymbro.errors.exceptions.NotFoundException;
import com.gbatistadev.gymbro.errors.exceptions.ResourceAlreadyExistsException;
import com.gbatistadev.gymbro.exercise.dto.CreateExerciseDto;
import com.gbatistadev.gymbro.exercise.dto.ExerciseDto;
import com.gbatistadev.gymbro.exercise.dto.UpdateExerciseDto;
import com.gbatistadev.gymbro.playlist_exercises.PlaylistExerciseRepository;
import com.gbatistadev.gymbro.workout_logs.WorkoutLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class ExerciseService {
    private final ExerciseRepository repository;
    private final PlaylistExerciseRepository playlistExercises;
    private final WorkoutLogRepository workoutLogs;
    private final ExerciseMapper mapper;
    private final CurrentUser currentUser;

    @Transactional
    public ExerciseDto create(CreateExerciseDto dto) throws ResourceAlreadyExistsException {
		String name = capitalize(dto.name());
		UUID userId = currentUser.id();
		if (repository.existsExerciseNameDuplicate(name, userId)) {
			throw new ResourceAlreadyExistsException("An exercise with that name already exists");
		}

        Exercise exercise = mapper.toEntity(dto);
		exercise.setName(name);
		exercise.setUserId(userId);
        repository.save(exercise);

        return mapper.toDto(exercise);
    }

    @Transactional(readOnly = true)
    public PageDto<ExerciseDto> search(
        String q, String muscle, boolean includeArchived, int page, int size
    ) {
        PageRequest pageable = PageRequest.of(
            Math.max(page, 0),
            Math.clamp(size, 1, 100),
            Sort.by("name"));

        Page<ExerciseDto> result = repository
            .searchForUser(
                currentUser.id(),
                q == null ? "" : q.trim(),
                muscle == null ? "" : muscle.trim(),
                includeArchived,
                pageable)
            .map(mapper::toDto);

        return new PageDto<>(
            result.getContent(),
            result.getNumber(),
            result.getSize(),
            result.getTotalElements(),
            result.getTotalPages());
    }

	@Transactional
	@Logging(action = "UPDATE")
	public ExerciseDto update(UpdateExerciseDto dto, UUID id) {
		Exercise entity = findEditable(id);

		mapper.updateEntity(dto, entity);

		return mapper.toDto(entity);
	}

    @Transactional
    public void archive(UUID id) {
        Exercise entity = findEditable(id);
        if (Boolean.TRUE.equals(entity.getIsArchived())) {
            return;
        }
        if (playlistExercises.existsByExerciseId(id) || workoutLogs.existsByExerciseId(id)) {
            throw new ConflictException("Exercise is used by a routine or workout log");
        }

        entity.setIsArchived(true);
        repository.save(entity);
    }

    private Exercise findEditable(UUID id) {
        Exercise entity = repository.findById(id)
            .orElseThrow(() -> new NotFoundException("Exercise not found: " + id));

        if (entity.getUserId() == null) {
            throw new ForbiddenException("Global exercises are read-only");
        }
        if (!entity.getUserId().equals(currentUser.id())) {
            throw new NotFoundException("Exercise not found: " + id);
        }
        return entity;
    }

	private String capitalize(String text) {
		return Stream.of(text.split(" "))
			.map(word -> word.isEmpty() ? word
				: word.substring(0, 1).toUpperCase(Locale.ROOT) + word.substring(1).toLowerCase(Locale.ROOT))
			.collect(Collectors.joining(" "));
	}
}
