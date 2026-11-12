package com.gbatistadev.gymbro.analytics;

import com.gbatistadev.gymbro.TestcontainersConfiguration;
import com.gbatistadev.gymbro.bioimpedance.Bioimpedance;
import com.gbatistadev.gymbro.bioimpedance.BioimpedanceRepository;
import com.gbatistadev.gymbro.config.jwt.JwtService;
import com.gbatistadev.gymbro.exercise.Exercise;
import com.gbatistadev.gymbro.exercise.ExerciseRepository;
import com.gbatistadev.gymbro.playlist.Playlist;
import com.gbatistadev.gymbro.playlist.PlaylistRepository;
import com.gbatistadev.gymbro.playlist_exercises.PlaylistExercise;
import com.gbatistadev.gymbro.playlist_exercises.PlaylistExerciseRepository;
import com.gbatistadev.gymbro.user.UserService;
import com.gbatistadev.gymbro.user.dto.CreateUserDto;
import com.gbatistadev.gymbro.user.dto.UserDto;
import com.gbatistadev.gymbro.workout_logs.WorkoutLog;
import com.gbatistadev.gymbro.workout_logs.WorkoutLogRepository;
import com.gbatistadev.gymbro.workout_session.SessionStatus;
import com.gbatistadev.gymbro.workout_session.WorkoutSession;
import com.gbatistadev.gymbro.workout_session.WorkoutSessionRepository;
import org.springframework.http.HttpHeaders;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
@DisplayName("Analytics and progression")
class AnalyticsFlowIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserService userService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ExerciseRepository exercises;

    @Autowired
    private PlaylistRepository playlists;

    @Autowired
    private PlaylistExerciseRepository playlistExercises;

    @Autowired
    private WorkoutSessionRepository sessions;

    @Autowired
    private WorkoutLogRepository logs;

    @Autowired
    private BioimpedanceRepository bioimpedance;

    @Test
    @DisplayName("stats, next targets, dashboard and trend")
    void shouldServeAnalytics() throws Exception {
        UserDto user = createUser();
        String auth = bearer(user);
        Exercise exercise = createExercise(user.getId());
        Playlist playlist = createPlaylist(user.getId());
        addPlaylistExercise(playlist, exercise, 8, 10);

        WorkoutSession recent = finishedSession(
            user.getId(), Instant.now().minus(2, ChronoUnit.DAYS), playlist);
        addLog(recent, exercise, 1, 100.0, 10, true);
        addLog(recent, exercise, 2, 100.0, 10, false);
        addLog(recent, exercise, 3, 100.0, 10, false);

        WorkoutSession older = finishedSession(
            user.getId(), Instant.now().minus(40, ChronoUnit.DAYS), null);
        addLog(older, exercise, 1, 90.0, 8, false);

        createMeasurement(user.getId(), Instant.now().minus(10, ChronoUnit.DAYS), 84.0);
        createMeasurement(user.getId(), Instant.now().minus(1, ChronoUnit.DAYS), 82.0);

        mockMvc.perform(get("/api/exercises/{id}/stats", exercise.getId()).header(HttpHeaders.AUTHORIZATION, auth))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.sessionCount").value(2))
            .andExpect(jsonPath("$.totalVolume").value(3720.0))
            .andExpect(jsonPath("$.bestWeight").value(100.0))
            .andExpect(jsonPath("$.monthlyBuckets.length()").value(2));

        mockMvc.perform(get("/api/playlists/{id}/next-targets", playlist.getId()).header(HttpHeaders.AUTHORIZATION, auth))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(1))
            .andExpect(jsonPath("$[0].exerciseId").value(exercise.getId().toString()))
            .andExpect(jsonPath("$[0].lastWeight").value(100.0))
            .andExpect(jsonPath("$[0].lastReps").value(10))
            .andExpect(jsonPath("$[0].suggestedWeight").value(102.5))
            .andExpect(jsonPath("$[0].suggestedReps").value(8));

        mockMvc.perform(get("/api/dashboard").param("weeks", "12").header(HttpHeaders.AUTHORIZATION, auth))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.weeks.length()").value(12))
            .andExpect(jsonPath("$.recentPrs.length()").value(1))
            .andExpect(jsonPath("$.recentPrs[0].exerciseName").value(exercise.getName()))
            .andExpect(jsonPath("$.weightDeltaKg").value(-2.0))
            .andExpect(jsonPath("$.nextPlaylistId").value(playlist.getId().toString()));

        mockMvc.perform(get("/api/bioimpedance/trend")
                .param("metric", "bodyWeightKg")
                .param("window", "2")
                .header(HttpHeaders.AUTHORIZATION, auth))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.points.length()").value(2))
            .andExpect(jsonPath("$.points[0].value").value(84.0))
            .andExpect(jsonPath("$.points[1].value").value(82.0))
            .andExpect(jsonPath("$.points[1].movingAverage").value(83.0))
            .andExpect(jsonPath("$.deltaAbsolute").value(-2.0))
            .andExpect(jsonPath("$.deltaPercentage").isNumber());
    }

    @Test
    @DisplayName("muscle volume aggregates finished sets by normalized muscle in the requested range")
    void shouldAggregateMuscleVolume() throws Exception {
        UserDto user = createUser();
        String auth = bearer(user);
        UserDto otherUser = createUser();
        Instant now = Instant.now().truncatedTo(ChronoUnit.MICROS);
        Instant from = now.minus(30, ChronoUnit.DAYS);
        Exercise chest = createExercise(user.getId(), "Peito");
        Exercise lowercaseChest = createExercise(user.getId(), "peito");
        Exercise back = createExercise(user.getId(), "Costas");

        WorkoutSession chestSession = session(user.getId(), SessionStatus.FINISHED, now.minus(1, ChronoUnit.DAYS));
        addLog(chestSession, chest, 1, 40.0, 10, false);
        addLog(chestSession, lowercaseChest, 1, 50.0, 8, false);
        WorkoutSession backSession = session(user.getId(), SessionStatus.FINISHED, now.minus(2, ChronoUnit.DAYS));
        addLog(backSession, back, 1, 60.0, 5, false);

        WorkoutSession inProgress = session(user.getId(), SessionStatus.IN_PROGRESS, now);
        addLog(inProgress, chest, 1, 100.0, 10, false);
        WorkoutSession abandoned = session(user.getId(), SessionStatus.ABANDONED, now);
        addLog(abandoned, chest, 1, 100.0, 10, false);
        WorkoutSession older = session(
            user.getId(), SessionStatus.FINISHED, from.minus(1, ChronoUnit.DAYS));
        addLog(older, chest, 1, 100.0, 10, false);
        WorkoutSession otherUsersSession = session(
            otherUser.getId(), SessionStatus.FINISHED, now.minus(1, ChronoUnit.DAYS));
        addLog(otherUsersSession, createExercise(otherUser.getId(), "Panturrilha"), 1, 500.0, 10, false);

        mockMvc.perform(get("/api/dashboard/muscle-volume")
                .param("from", from.toString())
                .param("to", now.toString())
                .header(HttpHeaders.AUTHORIZATION, auth))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(2))
            .andExpect(jsonPath("$[0].muscle").value("Peito"))
            .andExpect(jsonPath("$[0].volume").value(800.0))
            .andExpect(jsonPath("$[0].sets").value(2))
            .andExpect(jsonPath("$[1].muscle").value("Costas"))
            .andExpect(jsonPath("$[1].volume").value(300.0))
            .andExpect(jsonPath("$[1].sets").value(1));

        mockMvc.perform(get("/api/dashboard/muscle-volume")
                .header(HttpHeaders.AUTHORIZATION, bearer(createUser())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    @DisplayName("analytics are scoped to the authenticated user")
    void shouldIsolateAnalyticsBetweenUsers() throws Exception {
        UserDto owner = createUser();
        UserDto other = createUser();
        Exercise exercise = createExercise(owner.getId());
        Playlist playlist = createPlaylist(owner.getId());

        mockMvc.perform(get("/api/exercises/{id}/stats", exercise.getId())
                .header(HttpHeaders.AUTHORIZATION, bearer(other)))
            .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/playlists/{id}/next-targets", playlist.getId())
                .header(HttpHeaders.AUTHORIZATION, bearer(other)))
            .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/dashboard").header(HttpHeaders.AUTHORIZATION, bearer(other)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.weeks.length()").value(12))
            .andExpect(jsonPath("$.recentPrs.length()").value(0));
    }

    @Test
    @DisplayName("rejects an unsupported trend metric")
    void shouldRejectUnsupportedMetric() throws Exception {
        mockMvc.perform(get("/api/bioimpedance/trend")
                .param("metric", "peso")
                .header(HttpHeaders.AUTHORIZATION, bearer(createUser())))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("a single-rep set uses the lifted weight as its estimated 1RM")
    void shouldUseWeightAsE1rmForSingleRep() throws Exception {
        UserDto user = createUser();
        String auth = bearer(user);
        Exercise exercise = createExercise(user.getId());

        WorkoutSession session = finishedSession(user.getId(), Instant.now(), null);
        addLog(session, exercise, 1, 120.0, 1, true);

        mockMvc.perform(get("/api/exercises/{id}/stats", exercise.getId()).header(HttpHeaders.AUTHORIZATION, auth))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.bestE1rm").value(120.0));
    }

    private WorkoutSession finishedSession(UUID userId, Instant startedAt, Playlist playlist) {
        WorkoutSession session = new WorkoutSession();
        session.setUserId(userId);
        session.setStartedAt(startedAt);
        session.setEndedAt(startedAt.plus(1, ChronoUnit.HOURS));
        session.setStatus(SessionStatus.FINISHED);
        session.setTotalVolume(0.0);
        session.setPlaylist(playlist);
        return sessions.save(session);
    }

    private void addLog(
        WorkoutSession session, Exercise exercise, int setNumber,
        double weight, int reps, boolean isPr
    ) {
        WorkoutLog log = new WorkoutLog();
        log.setClientLogId(UUID.randomUUID());
        log.setSetNumber(setNumber);
        log.setWeight(weight);
        log.setReps(reps);
        log.setIsPr(isPr);
        log.setExercise(exercise);
        log.setWorkoutSession(session);
        logs.save(log);
    }

    private void createMeasurement(UUID userId, Instant measuredAt, double weight) {
        Bioimpedance measurement = new Bioimpedance();
        measurement.setUserId(userId);
        measurement.setMeasuredAt(measuredAt);
        measurement.setBodyWeightKg(weight);
        measurement.setBodyFatPercentage(18.0);
        measurement.setMuscleMassKg(38.0);
        bioimpedance.save(measurement);
    }

    private WorkoutSession session(UUID userId, SessionStatus status, Instant startedAt) {
        WorkoutSession session = new WorkoutSession();
        session.setUserId(userId);
        session.setStartedAt(startedAt);
        session.setStatus(status);
        session.setTotalVolume(0.0);
        return sessions.save(session);
    }

    private Exercise createExercise(UUID userId) {
        return createExercise(userId, "chest");
    }

    private Exercise createExercise(UUID userId, String primaryMuscle) {
        Exercise exercise = new Exercise();
        exercise.setName("Exercise-" + UUID.randomUUID());
        exercise.setPrimaryMuscle(primaryMuscle);
        exercise.setUserId(userId);
        return exercises.save(exercise);
    }

    private Playlist createPlaylist(UUID userId) {
        Playlist playlist = new Playlist();
        playlist.setName("Playlist-" + UUID.randomUUID());
        playlist.setUserId(userId);
        return playlists.save(playlist);
    }

    private void addPlaylistExercise(
        Playlist playlist, Exercise exercise, int repsMin, int repsMax
    ) {
        PlaylistExercise item = new PlaylistExercise();
        item.setPlaylist(playlist);
        item.setExercise(exercise);
        item.setOrderIndex(0);
        item.setTargetSets(3);
        item.setTargetRepsMin(repsMin);
        item.setTargetRepsMax(repsMax);
        playlistExercises.save(item);
    }

    private String bearer(UserDto user) {
        return "Bearer " + jwtService.createAccessToken(user.getId(), user.getEmail());
    }

    private UserDto createUser() {
        return userService.create(new CreateUserDto(
            "User",
            "u" + UUID.randomUUID().toString().substring(0, 8),
            "user-" + UUID.randomUUID() + "@example.com",
            "password123"
        ));
    }
}
