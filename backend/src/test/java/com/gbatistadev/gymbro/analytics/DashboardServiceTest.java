package com.gbatistadev.gymbro.analytics;

import com.gbatistadev.gymbro.analytics.dto.DashboardDto;
import com.gbatistadev.gymbro.bioimpedance.Bioimpedance;
import com.gbatistadev.gymbro.bioimpedance.BioimpedanceRepository;
import com.gbatistadev.gymbro.common.security.CurrentUser;
import com.gbatistadev.gymbro.playlist.Playlist;
import com.gbatistadev.gymbro.playlist.PlaylistRepository;
import com.gbatistadev.gymbro.user.User;
import com.gbatistadev.gymbro.user.UserRepository;
import com.gbatistadev.gymbro.workout_logs.WorkoutLogRepository;
import com.gbatistadev.gymbro.workout_session.SessionStatus;
import com.gbatistadev.gymbro.workout_session.WorkoutSession;
import com.gbatistadev.gymbro.workout_session.WorkoutSessionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.*;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("DashboardService")
class DashboardServiceTest {

    private static final ZoneId ZONE = ZoneId.of("America/Sao_Paulo");

    @Mock
    private WorkoutSessionRepository sessions;

    @Mock
    private WorkoutLogRepository logs;

    @Mock
    private BioimpedanceRepository bioimpedance;

    @Mock
    private PlaylistRepository playlists;

    @Mock
    private CurrentUser currentUser;

    @Mock
    private UserRepository users;

    private DashboardService service;

    private final UUID userId = UUID.randomUUID();

    @Test
    @DisplayName("returns continuous weekly buckets including weeks without training")
    void shouldReturnContinuousWeeks() {
        Instant now = Instant.parse("2026-11-09T12:00:00Z");
        service = serviceWithUserTimeZone(now, "America/Sao_Paulo");

        when(currentUser.id()).thenReturn(userId);
        when(sessions.findFinishedWithPlaylist(
            eq(userId), eq(SessionStatus.FINISHED), any(), any()))
            .thenReturn(List.of(finishedSession(now.minusSeconds(3600), 300.0, null)));
        when(logs.findRecentPrs(eq(userId), any(), any(), any())).thenReturn(List.of());
        when(bioimpedance.findByUserIdAndDeletedAtIsNullAndMeasuredAtBetweenOrderByMeasuredAtAsc(
            eq(userId), any(), any())).thenReturn(List.of());
        when(playlists.findByUserIdAndArchivedAtIsNullOrderByName(userId)).thenReturn(List.of());

        DashboardDto dashboard = service.dashboard(4);

        assertEquals(4, dashboard.weeks().size());
        assertEquals(List.of(0L, 0L, 0L, 1L),
            dashboard.weeks().stream().map(DashboardDto.WeekSummaryDto::sessions).toList());
        assertEquals(List.of(0.0, 0.0, 0.0, 300.0),
            dashboard.weeks().stream().map(DashboardDto.WeekSummaryDto::volume).toList());
        assertEquals(now.atZone(ZONE).toLocalDate().with(java.time.temporal.TemporalAdjusters
                .previousOrSame(DayOfWeek.MONDAY)).atStartOfDay(ZONE).toInstant(),
            dashboard.weeks().getLast().weekStart());
    }

    @Test
    @DisplayName("counts consecutive weeks that meet the weekly goal")
    void shouldCountStreak() {
        Instant now = Instant.parse("2026-11-09T12:00:00Z");
        service = serviceWithUserTimeZone(now, "America/Sao_Paulo");

        List<WorkoutSession> finished = new ArrayList<>();
        finished.addAll(fourSessions(now.minus(7, java.time.temporal.ChronoUnit.DAYS)));
        finished.addAll(fourSessions(now.minus(14, java.time.temporal.ChronoUnit.DAYS)));
        finished.add(finishedSession(now.minus(21, java.time.temporal.ChronoUnit.DAYS), 10.0, null));

        when(currentUser.id()).thenReturn(userId);
        when(sessions.findFinishedWithPlaylist(eq(userId), eq(SessionStatus.FINISHED), any(), any()))
            .thenReturn(finished);
        when(logs.findRecentPrs(eq(userId), any(), any(), any())).thenReturn(List.of());
        when(bioimpedance.findByUserIdAndDeletedAtIsNullAndMeasuredAtBetweenOrderByMeasuredAtAsc(
            eq(userId), any(), any())).thenReturn(List.of());
        when(playlists.findByUserIdAndArchivedAtIsNullOrderByName(userId)).thenReturn(List.of());

        DashboardDto dashboard = service.dashboard(4);

        assertEquals(2, dashboard.currentStreakWeeks());
    }

    @Test
    @DisplayName("reports weight delta and the most recently used playlist")
    void shouldReportWeightDeltaAndNextPlaylist() {
        Instant now = Instant.parse("2026-11-09T12:00:00Z");
        service = serviceWithUserTimeZone(now, "America/Sao_Paulo");

        Playlist playlist = new Playlist();
        playlist.setId(UUID.randomUUID());
        playlist.setName("Push");

        when(currentUser.id()).thenReturn(userId);
        when(sessions.findFinishedWithPlaylist(eq(userId), eq(SessionStatus.FINISHED), any(), any()))
            .thenReturn(List.of(finishedSession(now, 100.0, playlist)));
        when(logs.findRecentPrs(eq(userId), any(), any(), any())).thenReturn(List.of());
        when(bioimpedance.findByUserIdAndDeletedAtIsNullAndMeasuredAtBetweenOrderByMeasuredAtAsc(
            eq(userId), any(), any())).thenReturn(List.of(
                measurement(now.minus(10, java.time.temporal.ChronoUnit.DAYS), 84.0),
                measurement(now.minus(1, java.time.temporal.ChronoUnit.DAYS), 82.0)));

        DashboardDto dashboard = service.dashboard(12);

        assertEquals(-2.0, dashboard.weightDeltaKg());
        assertEquals(playlist.getId(), dashboard.nextPlaylistId());
        assertEquals("Push", dashboard.nextPlaylistName());
        verify(playlists, never()).findByUserIdAndArchivedAtIsNullOrderByName(any());
    }

    @Test
    @DisplayName("buckets sessions in the user's own time zone, not the server's")
    void shouldBucketByUserTimeZone() {
        Instant now = Instant.parse("2026-11-10T12:00:00Z");
        service = serviceWithUserTimeZone(now, "Asia/Tokyo");

        // domingo 17:00 em São Paulo, segunda 05:00 em Tóquio
        Instant sundayNightInSaoPaulo = Instant.parse("2026-11-08T20:00:00Z");

        when(currentUser.id()).thenReturn(userId);
        when(sessions.findFinishedWithPlaylist(eq(userId), eq(SessionStatus.FINISHED), any(), any()))
            .thenReturn(List.of(finishedSession(sundayNightInSaoPaulo, 100.0, null)));
        when(logs.findRecentPrs(eq(userId), any(), any(), any())).thenReturn(List.of());
        when(bioimpedance.findByUserIdAndDeletedAtIsNullAndMeasuredAtBetweenOrderByMeasuredAtAsc(
            eq(userId), any(), any())).thenReturn(List.of());
        when(playlists.findByUserIdAndArchivedAtIsNullOrderByName(userId)).thenReturn(List.of());

        DashboardDto dashboard = service.dashboard(2);

        assertEquals("Asia/Tokyo", dashboard.timezone());
        assertEquals(List.of(0L, 1L),
            dashboard.weeks().stream().map(DashboardDto.WeekSummaryDto::sessions).toList(),
            "a sessão pertence à semana de 09/11 em Tóquio, não à de 02/11");
        assertEquals(Instant.parse("2026-11-08T15:00:00Z"),
            dashboard.weeks().getLast().weekStart(),
            "segunda 00:00 em Tóquio");
    }

    @Test
    @DisplayName("defaults muscle volume to the last twelve calendar weeks in the user's time zone")
    void shouldDefaultMuscleVolumeRangeInUserTimeZone() {
        Instant now = Instant.parse("2026-11-12T12:00:00Z");
        ZoneId userZone = ZoneId.of("Asia/Tokyo");
        service = serviceWithUserTimeZone(now, userZone.getId());
        when(currentUser.id()).thenReturn(userId);
        when(logs.findMuscleVolume(eq(userId), any(Instant.class), any(Instant.class)))
            .thenReturn(List.of());

        assertTrue(service.muscleVolume(null, null).isEmpty());

        ArgumentCaptor<Instant> range = ArgumentCaptor.forClass(Instant.class);
        verify(logs).findMuscleVolume(eq(userId), range.capture(), range.capture());
        LocalDate currentWeek = LocalDate.ofInstant(now, userZone)
            .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        assertEquals(currentWeek.minusWeeks(11).atStartOfDay(userZone).toInstant(), range.getAllValues().get(0));
        assertEquals(currentWeek.plusWeeks(1).atStartOfDay(userZone).toInstant(), range.getAllValues().get(1));
    }

    private DashboardService serviceWithUserTimeZone(Instant now, String timeZone) {
        when(users.findById(userId)).thenReturn(Optional.of(userWithTimeZone(timeZone)));
        return new DashboardService(sessions, logs, bioimpedance, playlists, currentUser, users,
            Clock.fixed(now, ZoneOffset.UTC));
    }

    private User userWithTimeZone(String timeZone) {
        User user = new User();
        user.setId(userId);
        user.setName("Dashboard User");
        user.setEmail("dashboard@example.com");
        user.setPasswordHash("$2a$10$not-used");
        user.setTimezone(timeZone);
        return user;
    }

    private List<WorkoutSession> fourSessions(Instant start) {
        List<WorkoutSession> result = new ArrayList<>();
        for (int i = 0; i < 4; i++) {
            result.add(finishedSession(start.plusSeconds(i * 3600L), 100.0, null));
        }
        return result;
    }

    private WorkoutSession finishedSession(Instant startedAt, double volume, Playlist playlist) {
        WorkoutSession session = new WorkoutSession();
        session.setId(UUID.randomUUID());
        session.setUserId(userId);
        session.setStatus(SessionStatus.FINISHED);
        session.setStartedAt(startedAt);
        session.setTotalVolume(volume);
        session.setPlaylist(playlist);
        return session;
    }

    private Bioimpedance measurement(Instant measuredAt, double weight) {
        Bioimpedance measurement = new Bioimpedance();
        measurement.setMeasuredAt(measuredAt);
        measurement.setBodyWeightKg(weight);
        return measurement;
    }
}
