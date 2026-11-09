package com.gbatistadev.gymbro.exercise;

import com.gbatistadev.gymbro.common.security.CurrentUser;
import com.gbatistadev.gymbro.errors.exceptions.ForbiddenException;
import com.gbatistadev.gymbro.errors.exceptions.NotFoundException;
import com.gbatistadev.gymbro.errors.exceptions.ResourceAlreadyExistsException;
import com.gbatistadev.gymbro.exercise.dto.CreateExerciseDto;
import com.gbatistadev.gymbro.exercise.dto.ExerciseDto;
import com.gbatistadev.gymbro.exercise.dto.UpdateExerciseDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Exercise test class")
class ExerciseServiceTest {

    @Mock
    private ExerciseRepository repository;

    @Mock
    private ExerciseMapper mapper;

    @Mock
    private CurrentUser currentUser;

    @InjectMocks
    private ExerciseService service;

    private final UUID userId = UUID.randomUUID();

    @Test
    @DisplayName("create capitalizes the name and assigns the current user as owner")
    void shouldCreateExerciseForCurrentUser() {
        CreateExerciseDto dto = new CreateExerciseDto("supino RETO", "chest", "triceps");
        Exercise entity = new Exercise();
        ExerciseDto expected = new ExerciseDto();

        when(currentUser.id()).thenReturn(userId);
        when(repository.existsExerciseNameDuplicate("Supino Reto", userId)).thenReturn(false);
        when(mapper.toEntity(dto)).thenReturn(entity);
        when(mapper.toDto(entity)).thenReturn(expected);

        ExerciseDto result = service.create(dto);

        assertSame(expected, result);
        assertEquals("Supino Reto", entity.getName());
        assertEquals(userId, entity.getUserId());
        verify(repository).save(entity);
    }

    @Test
    @DisplayName("create rejects a name that already exists globally or for the same user")
    void shouldRejectDuplicateName() {
        CreateExerciseDto dto = new CreateExerciseDto("Supino Reto", "chest", "triceps");

        when(currentUser.id()).thenReturn(userId);
        when(repository.existsExerciseNameDuplicate("Supino Reto", userId)).thenReturn(true);

        assertThrows(ResourceAlreadyExistsException.class, () -> service.create(dto));
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("findAll returns global exercises plus the current user's own")
    void shouldListScopedExercises() {
        Exercise global = new Exercise();
        Exercise mine = new Exercise();
        mine.setUserId(userId);

        when(currentUser.id()).thenReturn(userId);
        when(repository.findAllForUser(userId)).thenReturn(List.of(global, mine));
        when(mapper.toDto(any(Exercise.class))).thenReturn(new ExerciseDto());

        assertEquals(2, service.findAll().size());
        verify(repository).findAllForUser(userId);
        verify(repository, never()).findAll();
    }

    @Test
    @DisplayName("update edits a custom exercise owned by the current user")
    void shouldUpdateOwnExercise() {
        UUID id = UUID.randomUUID();
        Exercise entity = new Exercise();
        entity.setUserId(userId);
        entity.setName("Old");
        UpdateExerciseDto dto = new UpdateExerciseDto("New", "chest", "triceps");

        when(currentUser.id()).thenReturn(userId);
        when(repository.findById(id)).thenReturn(Optional.of(entity));
        when(mapper.toDto(entity)).thenReturn(new ExerciseDto());

        service.update(dto, id);

        verify(mapper).updateEntity(dto, entity);
    }

    @Test
    @DisplayName("update rejects a global catalog exercise")
    void shouldRejectGlobalExerciseUpdate() {
        UUID id = UUID.randomUUID();
        Exercise entity = new Exercise();

        when(repository.findById(id)).thenReturn(Optional.of(entity));

        assertThrows(ForbiddenException.class,
            () -> service.update(new UpdateExerciseDto("New", "chest", "triceps"), id));
        verifyNoInteractions(mapper);
    }

    @Test
    @DisplayName("update hides an exercise owned by another user")
    void shouldHideForeignExercise() {
        UUID id = UUID.randomUUID();
        Exercise entity = new Exercise();
        entity.setUserId(UUID.randomUUID());

        when(repository.findById(id)).thenReturn(Optional.of(entity));
        when(currentUser.id()).thenReturn(userId);

        assertThrows(NotFoundException.class,
            () -> service.update(new UpdateExerciseDto("New", "chest", "triceps"), id));
        verifyNoInteractions(mapper);
    }
}
