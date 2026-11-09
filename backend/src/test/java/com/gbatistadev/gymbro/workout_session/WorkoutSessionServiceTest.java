package com.gbatistadev.gymbro.workout_session;

import com.gbatistadev.gymbro.common.dto.PageDto;
import com.gbatistadev.gymbro.common.mapper.PageMapper;
import com.gbatistadev.gymbro.common.security.CurrentUser;
import com.gbatistadev.gymbro.errors.exceptions.ConflictException;
import com.gbatistadev.gymbro.errors.exceptions.NotFoundException;
import com.gbatistadev.gymbro.exercise.Exercise;
import com.gbatistadev.gymbro.exercise.ExerciseRepository;
import com.gbatistadev.gymbro.playlist.PlaylistRepository;
import com.gbatistadev.gymbro.workout_logs.WorkoutLog;
import com.gbatistadev.gymbro.workout_logs.WorkoutLogRepository;
import com.gbatistadev.gymbro.workout_session.dto.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.ArgumentMatchers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("WorkoutSessionService")
class WorkoutSessionServiceTest {

    @Mock
    private WorkoutSessionRepository sessions;

    @Mock
    private WorkoutLogRepository logs;

    @Mock
    private ExerciseRepository exercises;

    @Mock
    private PlaylistRepository playlists;

    @Mock
    private WorkoutSessionMapper mapper;

    @Mock
    private PageMapper pageMapper;

    @Mock
    private CurrentUser currentUser;

    @InjectMocks
    private WorkoutSessionService service;

    private final UUID userId = UUID.randomUUID();
    private final UUID sessionId = UUID.randomUUID();
    private final UUID exerciseId = UUID.randomUUID();

    @Test
    @DisplayName("start assigns owner, status, zero volume and a timestamp")
    void shouldStartSession() {
        StartSessionRequest request = new StartSessionRequest(null, null);
        WorkoutSession entity = new WorkoutSession();
        SessionDto expected = sessionDto();

        when(currentUser.id()).thenReturn(userId);
        when(sessions.existsByUserIdAndStatus(userId, SessionStatus.IN_PROGRESS)).thenReturn(false);
        when(mapper.toEntity(request)).thenReturn(entity);
        when(sessions.save(entity)).thenReturn(entity);
        when(mapper.toDto(entity)).thenReturn(expected);

        assertSame(expected, service.start(request));

        assertEquals(userId, entity.getUserId());
        assertEquals(SessionStatus.IN_PROGRESS, entity.getStatus());
        assertEquals(0.0, entity.getTotalVolume());
        assertNotNull(entity.getStartedAt());
        assertNull(entity.getPlaylist());
    }

    @Test
    @DisplayName("start rejects a second open session")
    void shouldRejectSecondOpenSession() {
        when(currentUser.id()).thenReturn(userId);
        when(sessions.existsByUserIdAndStatus(userId, SessionStatus.IN_PROGRESS)).thenReturn(true);

        assertThrows(ConflictException.class,
            () -> service.start(new StartSessionRequest(null, null)));

        verify(sessions, never()).save(any());
    }

    @Test
    @DisplayName("start rejects a playlist owned by another user")
    void shouldRejectForeignPlaylist() {
        UUID playlistId = UUID.randomUUID();
        StartSessionRequest request = new StartSessionRequest(playlistId, null);

        when(currentUser.id()).thenReturn(userId);
        when(sessions.existsByUserIdAndStatus(userId, SessionStatus.IN_PROGRESS)).thenReturn(false);
        when(mapper.toEntity(request)).thenReturn(new WorkoutSession());
        when(playlists.findByIdAndUserId(playlistId, userId)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> service.start(request));

        verify(sessions, never()).save(any());
    }

    @Test
    @DisplayName("addLog computes set number, PR and total volume")
    void shouldAddLogAndRecalculateVolume() {
        WorkoutSession session = openSession();
        Exercise exercise = exercise();
        UUID clientLogId = UUID.randomUUID();
        AddLogRequest request =
            new AddLogRequest(clientLogId, exerciseId, 100.0, 8, null, 8, "hard");
        LogDto expected = logDto(clientLogId);

        when(currentUser.id()).thenReturn(userId);
        when(sessions.findByIdAndUserId(sessionId, userId)).thenReturn(Optional.of(session));
        when(logs.findByWorkoutSessionIdAndClientLogId(sessionId, clientLogId)).thenReturn(Optional.empty());
        when(exercises.findByIdForUser(exerciseId, userId)).thenReturn(Optional.of(exercise));
        when(logs.maxSetNumber(sessionId, exerciseId)).thenReturn(2);
        when(logs.maxE1rmExcludingSession(userId, exerciseId, sessionId)).thenReturn(100.0);
        when(mapper.toEntity(request)).thenReturn(new WorkoutLog());
        when(logs.saveAndFlush(any(WorkoutLog.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(logs.sumVolume(sessionId)).thenReturn(800.0);
        when(sessions.save(session)).thenReturn(session);
        when(mapper.toDto(any(WorkoutLog.class))).thenReturn(expected);

        LogResult result = service.addLog(sessionId, request);

        assertTrue(result.created());
        assertSame(expected, result.log());

        ArgumentCaptor<WorkoutLog> captor = ArgumentCaptor.forClass(WorkoutLog.class);
        verify(logs).saveAndFlush(captor.capture());
        WorkoutLog saved = captor.getValue();

        assertEquals(3, saved.getSetNumber());
        assertTrue(saved.getIsPr());
        assertEquals(session, saved.getWorkoutSession());
        assertEquals(exercise, saved.getExercise());
        assertEquals(800.0, session.getTotalVolume());
        verify(sessions).save(session);
    }

    @Test
    @DisplayName("addLog replays the same clientLogId without creating a new log")
    void shouldReplayIdempotentLog() {
        WorkoutSession session = openSession();
        Exercise exercise = exercise();
        UUID clientLogId = UUID.randomUUID();
        AddLogRequest request =
            new AddLogRequest(clientLogId, exerciseId, 100.0, 8, null, null, null);

        WorkoutLog existing = new WorkoutLog();
        existing.setExercise(exercise);
        existing.setWeight(100.0);
        existing.setReps(8);

        when(currentUser.id()).thenReturn(userId);
        when(sessions.findByIdAndUserId(sessionId, userId)).thenReturn(Optional.of(session));
        when(logs.findByWorkoutSessionIdAndClientLogId(sessionId, clientLogId))
            .thenReturn(Optional.of(existing));
        when(mapper.toDto(existing)).thenReturn(logDto(clientLogId));

        LogResult result = service.addLog(sessionId, request);

        assertFalse(result.created());
        verify(logs, never()).saveAndFlush(any());
        verify(exercises, never()).findByIdForUser(any(), any());
    }

    @Test
    @DisplayName("addLog rejects a reused clientLogId with a different payload")
    void shouldRejectReusedClientLogIdWithDifferentPayload() {
        WorkoutSession session = openSession();
        Exercise exercise = exercise();
        UUID clientLogId = UUID.randomUUID();
        AddLogRequest request =
            new AddLogRequest(clientLogId, exerciseId, 120.0, 8, null, null, null);

        WorkoutLog existing = new WorkoutLog();
        existing.setExercise(exercise);
        existing.setWeight(100.0);
        existing.setReps(8);

        when(currentUser.id()).thenReturn(userId);
        when(sessions.findByIdAndUserId(sessionId, userId)).thenReturn(Optional.of(session));
        when(logs.findByWorkoutSessionIdAndClientLogId(sessionId, clientLogId))
            .thenReturn(Optional.of(existing));

        assertThrows(ConflictException.class, () -> service.addLog(sessionId, request));
        verify(logs, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("addLog rejects a session that is not in progress")
    void shouldRejectLogOnClosedSession() {
        WorkoutSession session = openSession();
        session.setStatus(SessionStatus.FINISHED);

        when(currentUser.id()).thenReturn(userId);
        when(sessions.findByIdAndUserId(sessionId, userId)).thenReturn(Optional.of(session));

        assertThrows(ConflictException.class, () -> service.addLog(
            sessionId,
            new AddLogRequest(UUID.randomUUID(), exerciseId, 100.0, 8, null, null, null)));

        verifyNoInteractions(logs);
    }

    @Test
    @DisplayName("addLog rejects an exercise from another user")
    void shouldRejectUnknownExercise() {
        WorkoutSession session = openSession();
        UUID clientLogId = UUID.randomUUID();
        AddLogRequest request =
            new AddLogRequest(clientLogId, exerciseId, 100.0, 8, null, null, null);

        when(currentUser.id()).thenReturn(userId);
        when(sessions.findByIdAndUserId(sessionId, userId)).thenReturn(Optional.of(session));
        when(logs.findByWorkoutSessionIdAndClientLogId(sessionId, clientLogId)).thenReturn(Optional.empty());
        when(exercises.findByIdForUser(exerciseId, userId)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> service.addLog(sessionId, request));
        verify(logs, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("deleteLog removes the log and recalculates volume")
    void shouldDeleteLogAndRecalculateVolume() {
        WorkoutSession session = openSession();
        UUID logId = UUID.randomUUID();
        WorkoutLog log = new WorkoutLog();

        when(currentUser.id()).thenReturn(userId);
        when(sessions.findByIdAndUserId(sessionId, userId)).thenReturn(Optional.of(session));
        when(logs.findByIdAndWorkoutSessionId(logId, sessionId)).thenReturn(Optional.of(log));
        when(logs.sumVolume(sessionId)).thenReturn(250.0);
        when(sessions.save(session)).thenReturn(session);

        service.deleteLog(sessionId, logId);

        verify(logs).delete(log);
        verify(logs).flush();
        assertEquals(250.0, session.getTotalVolume());
        verify(sessions).save(session);
    }

    @Test
    @DisplayName("deleteLog rejects a closed session")
    void shouldRejectDeleteOnClosedSession() {
        WorkoutSession session = openSession();
        session.setStatus(SessionStatus.ABANDONED);

        when(currentUser.id()).thenReturn(userId);
        when(sessions.findByIdAndUserId(sessionId, userId)).thenReturn(Optional.of(session));

        assertThrows(ConflictException.class,
            () -> service.deleteLog(sessionId, UUID.randomUUID()));

        verify(logs, never()).delete(any());
    }

    @Test
    @DisplayName("finish sets status, end time, notes and volume")
    void shouldFinishSession() {
        WorkoutSession session = openSession();
        SessionDto expected = sessionDto();

        when(currentUser.id()).thenReturn(userId);
        when(sessions.findByIdAndUserId(sessionId, userId)).thenReturn(Optional.of(session));
        when(logs.countByWorkoutSessionId(sessionId)).thenReturn(2L);
        when(logs.sumVolume(sessionId)).thenReturn(900.0);
        when(sessions.save(session)).thenReturn(session);
        when(mapper.toDto(session)).thenReturn(expected);

        assertSame(expected, service.finish(
            sessionId, new FinishSessionRequest(SessionStatus.FINISHED, "good session")));

        assertEquals(SessionStatus.FINISHED, session.getStatus());
        assertNotNull(session.getEndedAt());
        assertEquals(900.0, session.getTotalVolume());
        assertEquals("good session", session.getNotes());
    }

    @Test
    @DisplayName("finish rejects a session without logs")
    void shouldRejectFinishWithoutLogs() {
        WorkoutSession session = openSession();

        when(currentUser.id()).thenReturn(userId);
        when(sessions.findByIdAndUserId(sessionId, userId)).thenReturn(Optional.of(session));
        when(logs.countByWorkoutSessionId(sessionId)).thenReturn(0L);

        assertThrows(ConflictException.class, () -> service.finish(
            sessionId, new FinishSessionRequest(SessionStatus.FINISHED, null)));

        verify(sessions, never()).save(any());
    }

    @Test
    @DisplayName("finish with the same status is idempotent")
    void shouldBeIdempotentWhenAlreadyFinished() {
        WorkoutSession session = openSession();
        session.setStatus(SessionStatus.FINISHED);
        SessionDto expected = sessionDto();

        when(currentUser.id()).thenReturn(userId);
        when(sessions.findByIdAndUserId(sessionId, userId)).thenReturn(Optional.of(session));
        when(mapper.toDto(session)).thenReturn(expected);

        assertSame(expected, service.finish(
            sessionId, new FinishSessionRequest(SessionStatus.FINISHED, null)));

        verify(logs, never()).countByWorkoutSessionId(any());
        verify(sessions, never()).save(any());
    }

    @Test
    @DisplayName("finish rejects IN_PROGRESS as a target status")
    void shouldRejectInvalidFinishStatus() {
        assertThrows(ConflictException.class, () -> service.finish(
            sessionId, new FinishSessionRequest(SessionStatus.IN_PROGRESS, null)));

        verifyNoInteractions(sessions, logs);
    }

    @Test
    @DisplayName("detail delegates grouping to the mapper")
    void shouldReturnSessionDetail() {
        WorkoutSession session = openSession();
        List<WorkoutLog> logsFound = List.of(new WorkoutLog());
        List<ExerciseLogsDto> grouped = List.of(new ExerciseLogsDto(exerciseId, "Supino", List.of()));
        SessionDetailDto expected = new SessionDetailDto(
            sessionId, null, SessionStatus.IN_PROGRESS, session.getStartedAt(),
            null, 0.0, null, grouped);

        when(currentUser.id()).thenReturn(userId);
        when(sessions.findByIdAndUserId(sessionId, userId)).thenReturn(Optional.of(session));
        when(logs.findDetailBySessionId(sessionId)).thenReturn(logsFound);
        when(mapper.toExerciseLogs(logsFound)).thenReturn(grouped);
        when(mapper.toDetail(session, grouped)).thenReturn(expected);

        assertSame(expected, service.detail(sessionId));
    }

    @Test
    @DisplayName("active returns the open session mapped to a DTO")
    void shouldReturnActiveSession() {
        WorkoutSession session = openSession();
        SessionDto expected = sessionDto();

        when(currentUser.id()).thenReturn(userId);
        when(sessions.findByUserIdAndStatus(userId, SessionStatus.IN_PROGRESS))
            .thenReturn(Optional.of(session));
        when(mapper.toDto(session)).thenReturn(expected);

        assertEquals(Optional.of(expected), service.active());
    }

    @Test
    @DisplayName("list clamps the page size to 100")
    void shouldClampPageSize() {
        WorkoutSession session = openSession();
        Page<WorkoutSession> page = new PageImpl<>(
            List.of(session), PageRequest.of(0, 100), 1);
        SessionDto expected = sessionDto();

        when(currentUser.id()).thenReturn(userId);
        when(sessions.findByUserIdAndStartedAtBetween(
            eq(userId), any(Instant.class), any(Instant.class), any(Pageable.class)))
            .thenReturn(page);
        when(mapper.toDto(session)).thenReturn(expected);

        PageDto<SessionDto> expectedPage = new PageDto<>(List.of(expected), 0, 100, 1, 1);
        when(pageMapper.toDto(ArgumentMatchers.<Page<SessionDto>>any()))
            .thenReturn(expectedPage);

        assertSame(expectedPage, service.list(null, null, -1, 500));

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(sessions).findByUserIdAndStartedAtBetween(
            eq(userId), any(Instant.class), any(Instant.class), captor.capture());
        assertEquals(100, captor.getValue().getPageSize());
        assertEquals(0, captor.getValue().getPageNumber());
    }

    private WorkoutSession openSession() {
        WorkoutSession session = new WorkoutSession();
        session.setId(sessionId);
        session.setUserId(userId);
        session.setStatus(SessionStatus.IN_PROGRESS);
        session.setStartedAt(Instant.now().minusSeconds(60));
        session.setTotalVolume(0.0);
        return session;
    }

    private Exercise exercise() {
        Exercise exercise = new Exercise();
        exercise.setId(exerciseId);
        exercise.setName("Supino");
        return exercise;
    }

    private SessionDto sessionDto() {
        return new SessionDto(
            sessionId, null, SessionStatus.IN_PROGRESS, Instant.now(), null, 0.0, null, 0L);
    }

    private LogDto logDto(UUID clientLogId) {
        return new LogDto(
            UUID.randomUUID(), clientLogId, exerciseId, "Supino", 1, 100.0, 8, true, 8, null);
    }
}
