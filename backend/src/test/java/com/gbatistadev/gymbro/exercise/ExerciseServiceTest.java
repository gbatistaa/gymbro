package com.gbatistadev.gymbro.exercise;

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
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Exercise test class")
class ExerciseServiceTest {

    @Mock
    private ExerciseRepository repository;

    @Mock
    private PlaylistExerciseRepository playlistExercises;

    @Mock
    private WorkoutLogRepository workoutLogs;

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
        CreateExerciseDto dto = new CreateExerciseDto("supino RETO", "chest", "triceps", "Barra", 2.5);
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
        CreateExerciseDto dto = new CreateExerciseDto("Supino Reto", "chest", "triceps", null, null);

        when(currentUser.id()).thenReturn(userId);
        when(repository.existsExerciseNameDuplicate("Supino Reto", userId)).thenReturn(true);

        assertThrows(ResourceAlreadyExistsException.class, () -> service.create(dto));
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("search trims filters, clamps pagination and maps the page")
    void shouldSearchExercises() {
        Exercise global = new Exercise();
        Exercise mine = new Exercise();
        mine.setUserId(userId);
        Page<Exercise> page = new PageImpl<>(List.of(global, mine), PageRequest.of(0, 20), 2);

        when(currentUser.id()).thenReturn(userId);
        when(repository.searchForUser(
            eq(userId), eq("supino"), eq("Peito"), eq(false), any(Pageable.class)))
            .thenReturn(page);
        when(mapper.toDto(any(Exercise.class))).thenReturn(new ExerciseDto());

        PageDto<ExerciseDto> result = service.search(" supino ", " Peito ", false, 0, 20);

        assertEquals(2, result.content().size());
        assertEquals(2, result.totalElements());

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(repository).searchForUser(
            eq(userId), eq("supino"), eq("Peito"), eq(false), captor.capture());
        assertEquals(20, captor.getValue().getPageSize());
    }

    @Test
    @DisplayName("update edits a custom exercise owned by the current user")
    void shouldUpdateOwnExercise() {
        UUID id = UUID.randomUUID();
        Exercise entity = new Exercise();
        entity.setUserId(userId);
        entity.setName("Old");
        UpdateExerciseDto dto = new UpdateExerciseDto("New", "chest", "triceps", "Barra", 2.5);

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
            () -> service.update(
                new UpdateExerciseDto("New", "chest", "triceps", null, null), id));
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
            () -> service.update(
                new UpdateExerciseDto("New", "chest", "triceps", null, null), id));
        verifyNoInteractions(mapper);
    }

    @Test
    @DisplayName("archive soft-deletes an unused custom exercise")
    void shouldArchiveUnusedExercise() {
        UUID id = UUID.randomUUID();
        Exercise entity = new Exercise();
        entity.setUserId(userId);
        entity.setIsArchived(false);

        when(repository.findById(id)).thenReturn(Optional.of(entity));
        when(currentUser.id()).thenReturn(userId);
        when(playlistExercises.existsByExerciseId(id)).thenReturn(false);
        when(workoutLogs.existsByExerciseId(id)).thenReturn(false);

        service.archive(id);

        assertTrue(entity.getIsArchived());
        verify(repository).save(entity);
    }

    @Test
    @DisplayName("archive rejects an exercise used by a routine or workout log")
    void shouldRejectArchiveOfUsedExercise() {
        UUID id = UUID.randomUUID();
        Exercise entity = new Exercise();
        entity.setUserId(userId);

        when(repository.findById(id)).thenReturn(Optional.of(entity));
        when(currentUser.id()).thenReturn(userId);
        when(playlistExercises.existsByExerciseId(id)).thenReturn(true);

        assertThrows(ConflictException.class, () -> service.archive(id));
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("archive is idempotent")
    void shouldArchiveIdempotently() {
        UUID id = UUID.randomUUID();
        Exercise entity = new Exercise();
        entity.setUserId(userId);
        entity.setIsArchived(true);

        when(repository.findById(id)).thenReturn(Optional.of(entity));
        when(currentUser.id()).thenReturn(userId);

        service.archive(id);

        verify(repository, never()).save(any());
        verifyNoInteractions(playlistExercises, workoutLogs);
    }

    @Test
    @DisplayName("archive rejects a global exercise")
    void shouldRejectArchiveOfGlobalExercise() {
        UUID id = UUID.randomUUID();
        Exercise entity = new Exercise();

        when(repository.findById(id)).thenReturn(Optional.of(entity));

        assertThrows(ForbiddenException.class, () -> service.archive(id));
        verify(repository, never()).save(any());
    }
}
