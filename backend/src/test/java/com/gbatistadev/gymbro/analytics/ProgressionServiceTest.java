package com.gbatistadev.gymbro.analytics;

import com.gbatistadev.gymbro.analytics.dto.NextTargetDto;
import com.gbatistadev.gymbro.common.security.CurrentUser;
import com.gbatistadev.gymbro.errors.exceptions.NotFoundException;
import com.gbatistadev.gymbro.exercise.Exercise;
import com.gbatistadev.gymbro.playlist.Playlist;
import com.gbatistadev.gymbro.playlist.PlaylistRepository;
import com.gbatistadev.gymbro.playlist_exercises.PlaylistExercise;
import com.gbatistadev.gymbro.playlist_exercises.PlaylistExerciseRepository;
import com.gbatistadev.gymbro.workout_logs.WorkoutLog;
import com.gbatistadev.gymbro.workout_logs.WorkoutLogRepository;
import com.gbatistadev.gymbro.workout_session.WorkoutSession;
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
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ProgressionService")
class ProgressionServiceTest {

    @Mock
    private PlaylistRepository playlists;

    @Mock
    private PlaylistExerciseRepository items;

    @Mock
    private WorkoutLogRepository logs;

    @Mock
    private CurrentUser currentUser;

    @InjectMocks
    private ProgressionService service;

    private final UUID userId = UUID.randomUUID();
    private final UUID playlistId = UUID.randomUUID();
    private final UUID sessionId = UUID.randomUUID();
    private final UUID exerciseId = UUID.randomUUID();

    @Test
    @DisplayName("all sets hitting the rep ceiling increase the weight and reset reps")
    void shouldIncreaseWeightWhenCeilingReached() {
        PlaylistExercise item = item(8, 10);
        stubLatestSession(item, List.of(log(1, 100.0, 10), log(2, 100.0, 10), log(3, 100.0, 10)));

        NextTargetDto target = service.nextTargets(playlistId).getFirst();

        assertEquals(102.5, target.suggestedWeight());
        assertEquals(8, target.suggestedReps());
        assertEquals(100.0, target.lastWeight());
        assertEquals(10, target.lastReps());
    }

    @Test
    @DisplayName("sets below the ceiling add one rep at the same weight")
    void shouldAddRepWhenCeilingNotReached() {
        PlaylistExercise item = item(8, 10);
        stubLatestSession(item, List.of(log(1, 100.0, 8), log(2, 100.0, 8), log(3, 100.0, 8)));

        NextTargetDto target = service.nextTargets(playlistId).getFirst();

        assertEquals(100.0, target.suggestedWeight());
        assertEquals(9, target.suggestedReps());
    }

    @Test
    @DisplayName("no history suggests the rep minimum without a weight")
    void shouldSuggestFirstTargetWithoutHistory() {
        PlaylistExercise item = item(8, 10);
        when(currentUser.id()).thenReturn(userId);
        when(playlists.findByIdAndUserId(playlistId, userId)).thenReturn(Optional.of(new Playlist()));
        when(items.findDetailByPlaylistId(playlistId)).thenReturn(List.of(item));
        when(logs.findLatestFinishedSessionPerExercise(userId, List.of(exerciseId)))
            .thenReturn(List.of());

        NextTargetDto target = service.nextTargets(playlistId).getFirst();

        assertNull(target.suggestedWeight());
        assertEquals(8, target.suggestedReps());
        assertNull(target.lastWeight());
        verify(logs, never()).findBySessionIdsWithExercise(any());
    }

    @Test
    @DisplayName("a missing rep ceiling disables progression")
    void shouldNotSuggestWhenRepCeilingIsMissing() {
        PlaylistExercise item = item(8, null);
        when(currentUser.id()).thenReturn(userId);
        when(playlists.findByIdAndUserId(playlistId, userId)).thenReturn(Optional.of(new Playlist()));
        when(items.findDetailByPlaylistId(playlistId)).thenReturn(List.of(item));
        when(logs.findLatestFinishedSessionPerExercise(userId, List.of(exerciseId)))
            .thenReturn(List.of());

        NextTargetDto target = service.nextTargets(playlistId).getFirst();

        assertNull(target.suggestedWeight());
        assertNull(target.suggestedReps());
    }

    @Test
    @DisplayName("bodyweight exercises only progress in reps")
    void shouldOnlyProgressRepsForBodyweight() {
        PlaylistExercise item = item(8, 10);
        item.getExercise().setIncrementKg(0.0);
        stubLatestSession(item, List.of(log(1, 0.0, 10), log(2, 0.0, 10), log(3, 0.0, 10)));

        NextTargetDto target = service.nextTargets(playlistId).getFirst();

        assertEquals(0.0, target.suggestedWeight());
        assertEquals(10, target.suggestedReps());
    }

    @Test
    @DisplayName("rejects a playlist owned by another user")
    void shouldRejectForeignPlaylist() {
        UUID otherPlaylist = UUID.randomUUID();
        when(currentUser.id()).thenReturn(userId);
        when(playlists.findByIdAndUserId(otherPlaylist, userId)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> service.nextTargets(otherPlaylist));
        verifyNoInteractions(items);
    }

    private void stubLatestSession(PlaylistExercise item, List<WorkoutLog> sets) {
        when(currentUser.id()).thenReturn(userId);
        when(playlists.findByIdAndUserId(playlistId, userId)).thenReturn(Optional.of(new Playlist()));
        when(items.findDetailByPlaylistId(playlistId)).thenReturn(List.of(item));

        WorkoutLogRepository.LatestExerciseSession latest =
            mock(WorkoutLogRepository.LatestExerciseSession.class);
        when(latest.getExerciseId()).thenReturn(exerciseId);
        when(latest.getSessionId()).thenReturn(sessionId);
        when(logs.findLatestFinishedSessionPerExercise(userId, List.of(exerciseId)))
            .thenReturn(List.of(latest));

        when(logs.findBySessionIdsWithExercise(any()))
            .thenReturn(sets.stream().map(log -> withSession(log, item.getExercise())).toList());
    }

    private WorkoutLog withSession(WorkoutLog log, Exercise exercise) {
        WorkoutSession session = new WorkoutSession();
        session.setId(sessionId);
        log.setWorkoutSession(session);
        log.setExercise(exercise);
        return log;
    }

    private PlaylistExercise item(Integer repsMin, Integer repsMax) {
        Exercise exercise = new Exercise();
        exercise.setId(exerciseId);
        exercise.setName("Supino");
        exercise.setIncrementKg(2.5);

        PlaylistExercise item = new PlaylistExercise();
        item.setExercise(exercise);
        item.setTargetSets(3);
        item.setTargetRepsMin(repsMin);
        item.setTargetRepsMax(repsMax);
        return item;
    }

    private WorkoutLog log(int setNumber, double weight, int reps) {
        WorkoutLog log = new WorkoutLog();
        log.setSetNumber(setNumber);
        log.setWeight(weight);
        log.setReps(reps);
        return log;
    }
}
