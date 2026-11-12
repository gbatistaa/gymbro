package com.gbatistadev.gymbro.analytics;

import com.gbatistadev.gymbro.analytics.dto.DashboardDto;
import com.gbatistadev.gymbro.analytics.dto.MuscleVolumeDto;
import com.gbatistadev.gymbro.bioimpedance.Bioimpedance;
import com.gbatistadev.gymbro.bioimpedance.BioimpedanceRepository;
import com.gbatistadev.gymbro.common.security.CurrentUser;
import com.gbatistadev.gymbro.errors.exceptions.NotFoundException;
import com.gbatistadev.gymbro.playlist.Playlist;
import com.gbatistadev.gymbro.playlist.PlaylistRepository;
import com.gbatistadev.gymbro.workout_logs.WorkoutLog;
import com.gbatistadev.gymbro.workout_logs.WorkoutLogRepository;
import com.gbatistadev.gymbro.workout_session.SessionStatus;
import com.gbatistadev.gymbro.workout_session.WorkoutSession;
import com.gbatistadev.gymbro.workout_session.WorkoutSessionRepository;
import com.gbatistadev.gymbro.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.time.temporal.TemporalAdjusters;
import java.util.*;

@Service
@RequiredArgsConstructor
public class DashboardService {
    private static final int STREAK_GOAL = 4;
    private static final int RECENT_PR_LIMIT = 10;

    private final WorkoutSessionRepository sessions;
    private final WorkoutLogRepository logs;
    private final BioimpedanceRepository bioimpedance;
    private final PlaylistRepository playlists;
    private final CurrentUser currentUser;
    private final UserRepository users;
    private final Clock clock;

    @Transactional(readOnly = true)
    public DashboardDto dashboard(int weeks) {
        UUID userId = currentUser.id();
        int count = Math.clamp(weeks, 1, 52);

        // o fuso do usuário manda: 22:00 em São Paulo é o dia anterior em UTC
        ZoneId zone = userZone(userId);

        LocalDate currentWeek = LocalDate.now(clock.withZone(zone))
            .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate firstWeek = currentWeek.minusWeeks(count - 1L);
        Instant from = firstWeek.atStartOfDay(zone).toInstant();
        Instant to = currentWeek.plusWeeks(1).atStartOfDay(zone).toInstant();

        List<WorkoutSession> finished =
            sessions.findFinishedWithPlaylist(userId, SessionStatus.FINISHED, from, to);

        List<DashboardDto.WeekSummaryDto> weekly = weeklySummaries(firstWeek, count, finished, zone);
        List<DashboardDto.RecentPrDto> prs = recentPrs(userId, from, to);
        Double weightDelta = weightDelta(userId, from, to);
        Playlist next = nextPlaylist(userId, finished);

        return new DashboardDto(
            weekly,
            streak(weekly),
            prs,
            weightDelta,
            next == null ? null : next.getId(),
            next == null ? null : next.getName(),
            zone.getId());
    }

    @Transactional(readOnly = true)
    public List<MuscleVolumeDto> muscleVolume(Instant from, Instant to) {
        UUID userId = currentUser.id();
        ZoneId zone = userZone(userId);
        LocalDate currentWeek = LocalDate.now(clock.withZone(zone))
            .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        Instant rangeStart = from != null
            ? from : currentWeek.minusWeeks(11).atStartOfDay(zone).toInstant();
        Instant rangeEnd = to != null
            ? to : currentWeek.plusWeeks(1).atStartOfDay(zone).toInstant();

        return logs.findMuscleVolume(userId, rangeStart, rangeEnd).stream()
            .map(row -> new MuscleVolumeDto(row.getMuscle(), row.getVolume(), row.getSets()))
            .toList();
    }

    private ZoneId userZone(UUID userId) {
        return users.findById(userId)
            .map(user -> ZoneId.of(user.getTimezone()))
            .orElseThrow(() -> new NotFoundException("User not found: " + userId));
    }

    private List<DashboardDto.WeekSummaryDto> weeklySummaries(
        LocalDate firstWeek, int count, List<WorkoutSession> finished, ZoneId zone
    ) {
        Map<LocalDate, long[]> buckets = new HashMap<>();
        Map<LocalDate, double[]> volumes = new HashMap<>();

        for (WorkoutSession session : finished) {
            LocalDate week = session.getStartedAt().atZone(zone).toLocalDate()
                .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            buckets.computeIfAbsent(week, key -> new long[1])[0]++;
            volumes.computeIfAbsent(week, key -> new double[1])[0] +=
                session.getTotalVolume() == null ? 0 : session.getTotalVolume();
        }

        List<DashboardDto.WeekSummaryDto> result = new ArrayList<>(count);
        for (int i = 0; i < count; i++) {
            LocalDate week = firstWeek.plusWeeks(i);
            result.add(new DashboardDto.WeekSummaryDto(
                week.atStartOfDay(zone).toInstant(),
                buckets.getOrDefault(week, new long[1])[0],
                volumes.getOrDefault(week, new double[1])[0]));
        }
        return result;
    }

    private int streak(List<DashboardDto.WeekSummaryDto> weekly) {
        int streak = 0;
        for (int i = weekly.size() - 1; i >= 0; i--) {
            if (weekly.get(i).sessions() >= STREAK_GOAL) {
                streak++;
            } else if (i != weekly.size() - 1) {
                // the current week may still be incomplete, so it does not break the streak
                break;
            }
        }
        return streak;
    }

    private List<DashboardDto.RecentPrDto> recentPrs(UUID userId, Instant from, Instant to) {
        return logs.findRecentPrs(userId, from, to, PageRequest.of(0, RECENT_PR_LIMIT))
            .stream()
            .map(this::toRecentPr)
            .toList();
    }

    private DashboardDto.RecentPrDto toRecentPr(WorkoutLog log) {
        return new DashboardDto.RecentPrDto(
            log.getId(),
            log.getExercise().getId(),
            log.getExercise().getName(),
            log.getWorkoutSession().getStartedAt(),
            log.getWeight(),
            log.getReps(),
            e1rm(log.getWeight(), log.getReps()));
    }

    private Double weightDelta(UUID userId, Instant from, Instant to) {
        List<Bioimpedance> measurements = bioimpedance
            .findByUserIdAndDeletedAtIsNullAndMeasuredAtBetweenOrderByMeasuredAtAsc(userId, from, to);

        Double first = weightFrom(measurements, false);
        Double last = weightFrom(measurements, true);
        return first == null || last == null ? null : last - first;
    }

    private Double weightFrom(List<Bioimpedance> measurements, boolean fromEnd) {
        for (int i = 0; i < measurements.size(); i++) {
            Bioimpedance measurement = measurements.get(fromEnd
                ? measurements.size() - 1 - i : i);
            if (measurement.getBodyWeightKg() != null) {
                return measurement.getBodyWeightKg();
            }
        }
        return null;
    }

    private Playlist nextPlaylist(UUID userId, List<WorkoutSession> finished) {
        for (int i = finished.size() - 1; i >= 0; i--) {
            if (finished.get(i).getPlaylist() != null) {
                return finished.get(i).getPlaylist();
            }
        }
        List<Playlist> active = playlists.findByUserIdAndArchivedAtIsNullOrderByName(userId);
        return active.isEmpty() ? null : active.getFirst();
    }

    private double e1rm(double weight, int reps) {
        return reps == 1 ? weight : weight * (1 + reps / 30.0);
    }
}
