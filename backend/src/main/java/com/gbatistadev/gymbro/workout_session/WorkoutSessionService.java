package com.gbatistadev.gymbro.workout_session;

import com.gbatistadev.gymbro.common.aspect.Logging;
import com.gbatistadev.gymbro.common.security.CurrentUser;
import com.gbatistadev.gymbro.errors.exceptions.ConflictException;
import com.gbatistadev.gymbro.errors.exceptions.NotFoundException;
import com.gbatistadev.gymbro.exercise.Exercise;
import com.gbatistadev.gymbro.exercise.ExerciseRepository;
import com.gbatistadev.gymbro.playlist.PlaylistRepository;
import com.gbatistadev.gymbro.workout_logs.WorkoutLog;
import com.gbatistadev.gymbro.workout_logs.WorkoutLogRepository;
import com.gbatistadev.gymbro.workout_session.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
public class WorkoutSessionService {
    private final WorkoutSessionRepository sessions;
    private final WorkoutLogRepository logs;
    private final ExerciseRepository exercises;
    private final PlaylistRepository playlists;
    private final WorkoutSessionMapper mapper;
    private final CurrentUser currentUser;

    @Transactional
    public SessionDto start(StartSessionRequest dto) {
        UUID userId = currentUser.id();
        if (sessions.existsByUserIdAndStatus(userId, SessionStatus.IN_PROGRESS)) {
            throw new ConflictException("An open session already exists");
        }

        WorkoutSession session = mapper.toEntity(dto);
        session.setUserId(userId);
        session.setStartedAt(session.getStartedAt() != null ? session.getStartedAt() : Instant.now());
        session.setStatus(SessionStatus.IN_PROGRESS);
        session.setTotalVolume(0.0);

        if (dto.playlistId() != null) {
            session.setPlaylist(playlists.findByIdAndUserId(dto.playlistId(), userId)
                .orElseThrow(() -> new NotFoundException("Playlist not found: " + dto.playlistId())));
        }

        return mapper.toDto(sessions.save(session));
    }

    @Transactional(readOnly = true)
    public Optional<SessionDto> active() {
        return sessions.findByUserIdAndStatus(currentUser.id(), SessionStatus.IN_PROGRESS)
            .map(mapper::toDto);
    }

    @Transactional
    public LogResult addLog(UUID sessionId, AddLogRequest dto) {
        UUID userId = currentUser.id();
        WorkoutSession session = load(sessionId, userId);

        if (session.getStatus() != SessionStatus.IN_PROGRESS) {
            throw new ConflictException("Session is not in progress");
        }

        Optional<WorkoutLog> existing =
            logs.findByWorkoutSessionIdAndClientLogId(sessionId, dto.clientLogId());
        if (existing.isPresent()) {
            WorkoutLog log = existing.get();
            if (!samePayload(log, dto)) {
                throw new ConflictException("clientLogId reused with a different payload");
            }
            return new LogResult(mapper.toDto(log), false);
        }

        Exercise exercise = exercises.findByIdForUser(dto.exerciseId(), userId)
            .orElseThrow(() -> new NotFoundException("Exercise not found: " + dto.exerciseId()));

        int setNumber = dto.setNumber() != null
            ? dto.setNumber()
            : logs.maxSetNumber(sessionId, exercise.getId()) + 1;

        WorkoutLog log = mapper.toEntity(dto);
        log.setWorkoutSession(session);
        log.setExercise(exercise);
        log.setSetNumber(setNumber);
        log.setIsPr(isPr(userId, exercise.getId(), sessionId, dto.weight(), dto.reps()));

        try {
            logs.saveAndFlush(log);
        } catch (DataIntegrityViolationException e) {
            throw new ConflictException("Set number already exists for this exercise");
        }

        session.setTotalVolume(logs.sumVolume(sessionId));
        sessions.save(session);

        return new LogResult(mapper.toDto(log), true);
    }

    @Transactional
    public void deleteLog(UUID sessionId, UUID logId) {
        UUID userId = currentUser.id();
        WorkoutSession session = load(sessionId, userId);

        if (session.getStatus() != SessionStatus.IN_PROGRESS) {
            throw new ConflictException("Session is not in progress");
        }

        WorkoutLog log = logs.findByIdAndWorkoutSessionId(logId, sessionId)
            .orElseThrow(() -> new NotFoundException("Log not found: " + logId));

        logs.delete(log);
        logs.flush();

        session.setTotalVolume(logs.sumVolume(sessionId));
        sessions.save(session);
    }

    @Transactional
    @Logging(action = "FINISH_SESSION")
    public SessionDto finish(UUID sessionId, FinishSessionRequest dto) {
        if (dto.status() != SessionStatus.FINISHED && dto.status() != SessionStatus.ABANDONED) {
            throw new ConflictException("status must be FINISHED or ABANDONED");
        }

        WorkoutSession session = load(sessionId, currentUser.id());

        if (session.getStatus() == dto.status()) {
            return mapper.toDto(session);
        }
        if (session.getStatus() != SessionStatus.IN_PROGRESS) {
            throw new ConflictException("Session already " + session.getStatus());
        }
        if (dto.status() == SessionStatus.FINISHED
            && logs.countByWorkoutSessionId(sessionId) == 0) {
            throw new ConflictException("Cannot finish a session without logs");
        }

        session.setStatus(dto.status());
        session.setEndedAt(Instant.now());
        session.setTotalVolume(logs.sumVolume(sessionId));
        if (dto.notes() != null) {
            session.setNotes(dto.notes());
        }

        return mapper.toDto(sessions.save(session));
    }

    @Transactional(readOnly = true)
    public PageDto<SessionDto> list(Instant from, Instant to, int page, int size) {
        Instant start = from != null ? from : Instant.EPOCH;
        Instant end = to != null ? to : Instant.now();
        PageRequest pageable = PageRequest.of(
            Math.max(page, 0),
                Math.clamp(size, 1, 100),
            Sort.by(Sort.Direction.DESC, "startedAt"));

        Page<SessionDto> result = sessions
            .findByUserIdAndStartedAtBetween(currentUser.id(), start, end, pageable)
            .map(mapper::toDto);

        return new PageDto<>(
            result.getContent(),
            result.getNumber(),
            result.getSize(),
            result.getTotalElements(),
            result.getTotalPages());
    }

    @Transactional(readOnly = true)
    public SessionDetailDto detail(UUID sessionId) {
        WorkoutSession session = load(sessionId, currentUser.id());
        return mapper.toDetail(session, mapper.toExerciseLogs(logs.findDetailBySessionId(sessionId)));
    }

    private WorkoutSession load(UUID sessionId, UUID userId) {
        return sessions.findByIdAndUserId(sessionId, userId)
            .orElseThrow(() -> new NotFoundException("Session not found: " + sessionId));
    }

    private boolean isPr(UUID userId, UUID exerciseId, UUID sessionId, Double weight, Integer reps) {
        double candidate = estimateOneRepMax(weight, reps);
        double previousBest = logs.maxE1rmExcludingSession(userId, exerciseId, sessionId);
        return candidate > previousBest;
    }

    private double estimateOneRepMax(double weight, int reps) {
        return reps == 1 ? weight : weight * (1 + reps / 30.0);
    }

    private boolean samePayload(WorkoutLog log, AddLogRequest dto) {
        return log.getExercise().getId().equals(dto.exerciseId())
            && log.getWeight().equals(dto.weight())
            && log.getReps().equals(dto.reps());
    }

}
