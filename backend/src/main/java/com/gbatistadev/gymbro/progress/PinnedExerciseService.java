package com.gbatistadev.gymbro.progress;

import com.gbatistadev.gymbro.common.security.CurrentUser;
import com.gbatistadev.gymbro.errors.exceptions.BadRequestException;
import com.gbatistadev.gymbro.errors.exceptions.NotFoundException;
import com.gbatistadev.gymbro.exercise.Exercise;
import com.gbatistadev.gymbro.exercise.ExerciseRepository;
import com.gbatistadev.gymbro.progress.dto.PinnedExerciseDto;
import com.gbatistadev.gymbro.progress.dto.UpdatePinnedExercisesRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PinnedExerciseService {
    private final PinnedExerciseRepository pinned;
    private final ExerciseRepository exercises;
    private final CurrentUser currentUser;

    @Transactional(readOnly = true)
    public List<PinnedExerciseDto> list() {
        return toDtos(pinned.findDetailByUserId(currentUser.id()));
    }

    /** Substitui a lista inteira (idempotente). Falhar na validação mantém a lista atual. */
    @Transactional
    public List<PinnedExerciseDto> replace(UpdatePinnedExercisesRequest request) {
        UUID userId = currentUser.id();
        List<UUID> exerciseIds = request.exerciseIds();
        if (new HashSet<>(exerciseIds).size() != exerciseIds.size()) {
            throw new BadRequestException("DUPLICATE_EXERCISE", "An exercise can be pinned only once");
        }

        List<Exercise> resolved = new ArrayList<>(exerciseIds.size());
        for (UUID exerciseId : exerciseIds) {
            resolved.add(exercises.findByIdForUser(exerciseId, userId)
                .orElseThrow(() -> new NotFoundException("Exercise not found: " + exerciseId)));
        }

        pinned.deleteByUserId(userId);
        List<PinnedExercise> saved = new ArrayList<>(resolved.size());
        for (int position = 0; position < resolved.size(); position++) {
            PinnedExercise entry = new PinnedExercise();
            entry.setUserId(userId);
            entry.setExercise(resolved.get(position));
            entry.setPosition(position);
            saved.add(entry);
        }

        return toDtos(pinned.saveAll(saved));
    }

    private List<PinnedExerciseDto> toDtos(List<PinnedExercise> entries) {
        return entries.stream()
            .map(entry -> new PinnedExerciseDto(
                entry.getExercise().getId(),
                entry.getExercise().getName(),
                entry.getExercise().getPrimaryMuscle(),
                entry.getPosition()))
            .toList();
    }
}
