package com.gbatistadev.gymbro.progress;

import com.gbatistadev.gymbro.TestcontainersConfiguration;
import com.gbatistadev.gymbro.config.jwt.JwtService;
import com.gbatistadev.gymbro.exercise.Exercise;
import com.gbatistadev.gymbro.exercise.ExerciseRepository;
import com.gbatistadev.gymbro.user.UserService;
import com.gbatistadev.gymbro.user.dto.CreateUserDto;
import com.gbatistadev.gymbro.user.dto.UpdateUserDto;
import com.gbatistadev.gymbro.user.dto.UserDto;
import com.gbatistadev.gymbro.workout_logs.WorkoutLog;
import com.gbatistadev.gymbro.workout_logs.WorkoutLogRepository;
import com.gbatistadev.gymbro.workout_session.SessionStatus;
import com.gbatistadev.gymbro.workout_session.WorkoutSession;
import com.gbatistadev.gymbro.workout_session.WorkoutSessionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.UUID;

import static org.hamcrest.Matchers.closeTo;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
@DisplayName("Exercise progress")
class ExerciseProgressIT {

    private static final String LIST_URL = "/api/progress/exercises";
    private static final String SERIES_URL = "/api/progress/exercises/{id}/series";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserService userService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ExerciseRepository exercises;

    @Autowired
    private WorkoutSessionRepository sessions;

    @Autowired
    private WorkoutLogRepository logs;

    @Nested
    @DisplayName("list of trained exercises")
    class ListOfTrainedExercises {

        @Test
        @DisplayName("aggregates only the user's finished sets")
        void shouldAggregateFinishedSets() throws Exception {
            UserDto user = createUser();
            Exercise squat = createExercise(user.getId(), "Squat", "Quadriceps");
            WorkoutSession first = session(user.getId(), SessionStatus.FINISHED, "2026-03-01T10:00:00Z");
            addLog(first, squat, 1, 100.0, 5);
            addLog(first, squat, 2, 100.0, 5);
            WorkoutSession second = session(user.getId(), SessionStatus.FINISHED, "2026-03-08T10:00:00Z");
            addLog(second, squat, 1, 110.0, 3);
            WorkoutSession inProgress = session(user.getId(), SessionStatus.IN_PROGRESS, "2026-03-09T10:00:00Z");
            addLog(inProgress, squat, 1, 200.0, 10);
            createExercise(user.getId(), "Never trained", "Chest");
            UserDto other = createUser();
            WorkoutSession foreign = session(other.getId(), SessionStatus.FINISHED, "2026-03-08T10:00:00Z");
            addLog(foreign, createExercise(other.getId(), "Foreign", "Back"), 1, 300.0, 1);

            mockMvc.perform(get(LIST_URL).header(HttpHeaders.AUTHORIZATION, bearer(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].exerciseId").value(squat.getId().toString()))
                .andExpect(jsonPath("$.content[0].name").value("Squat"))
                .andExpect(jsonPath("$.content[0].primaryMuscle").value("Quadriceps"))
                .andExpect(jsonPath("$.content[0].sessionCount").value(2))
                .andExpect(jsonPath("$.content[0].totalSets").value(3))
                .andExpect(jsonPath("$.content[0].totalVolume").value(1330.0))
                .andExpect(jsonPath("$.content[0].bestWeight").value(110.0))
                .andExpect(jsonPath("$.content[0].bestE1rm").value(closeTo(121.0, 1e-9)))
                .andExpect(jsonPath("$.content[0].lastPerformedAt").value("2026-03-08T10:00:00Z"))
                .andExpect(jsonPath("$.content[0].isPinned").value(false));
        }

        @Test
        @DisplayName("defaults to the most recently trained first")
        void shouldSortByLastPerformedByDefault() throws Exception {
            UserDto user = createUser();
            trained(user, "Old", "Chest", "2026-01-01T10:00:00Z", 50.0, 10);
            trained(user, "Recent", "Chest", "2026-03-01T10:00:00Z", 50.0, 10);

            mockMvc.perform(get(LIST_URL).header(HttpHeaders.AUTHORIZATION, bearer(user)))
                .andExpect(jsonPath("$.content[0].name").value("Recent"))
                .andExpect(jsonPath("$.content[1].name").value("Old"));
        }

        @Test
        @DisplayName("sorts by the requested column and direction")
        void shouldSortByRequestedColumn() throws Exception {
            UserDto user = createUser();
            trained(user, "bravo", "Chest", "2026-01-01T10:00:00Z", 80.0, 10);
            trained(user, "Alpha", "Chest", "2026-01-02T10:00:00Z", 40.0, 10);
            trained(user, "Charlie", "Chest", "2026-01-03T10:00:00Z", 60.0, 10);
            String auth = bearer(user);

            mockMvc.perform(get(LIST_URL).param("sort", "NAME").param("direction", "ASC")
                    .header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(jsonPath("$.content[0].name").value("Alpha"))
                .andExpect(jsonPath("$.content[1].name").value("bravo"))
                .andExpect(jsonPath("$.content[2].name").value("Charlie"));

            mockMvc.perform(get(LIST_URL).param("sort", "TOTAL_VOLUME").param("direction", "DESC")
                    .header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(jsonPath("$.content[0].name").value("bravo"))
                .andExpect(jsonPath("$.content[1].name").value("Charlie"))
                .andExpect(jsonPath("$.content[2].name").value("Alpha"));

            mockMvc.perform(get(LIST_URL).param("sort", "BEST_WEIGHT").param("direction", "ASC")
                    .header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(jsonPath("$.content[0].name").value("Alpha"));
        }

        @Test
        @DisplayName("filters by name fragment and muscle, ignoring case")
        void shouldFilterByNameAndMuscle() throws Exception {
            UserDto user = createUser();
            trained(user, "Bench press", "Chest", "2026-01-01T10:00:00Z", 80.0, 10);
            trained(user, "Incline bench", "chest", "2026-01-02T10:00:00Z", 60.0, 10);
            trained(user, "Leg press", "Quadriceps", "2026-01-03T10:00:00Z", 200.0, 10);
            String auth = bearer(user);

            mockMvc.perform(get(LIST_URL).param("q", "BENCH").header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(jsonPath("$.totalElements").value(2));

            mockMvc.perform(get(LIST_URL).param("muscle", "CHEST").header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(jsonPath("$.totalElements").value(2));

            mockMvc.perform(get(LIST_URL).param("q", "press").param("muscle", "Quadriceps")
                    .header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].name").value("Leg press"));
        }

        @Test
        @DisplayName("treats LIKE wildcards in the search as plain text")
        void shouldEscapeWildcards() throws Exception {
            UserDto user = createUser();
            trained(user, "Squat", "Quadriceps", "2026-01-01T10:00:00Z", 80.0, 10);
            String auth = bearer(user);

            mockMvc.perform(get(LIST_URL).param("q", "%").header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(jsonPath("$.totalElements").value(0));

            mockMvc.perform(get(LIST_URL).param("q", "S_uat").header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(jsonPath("$.totalElements").value(0));
        }

        @Test
        @DisplayName("paginates with stable order")
        void shouldPaginate() throws Exception {
            UserDto user = createUser();
            trained(user, "A", "Chest", "2026-01-01T10:00:00Z", 80.0, 10);
            trained(user, "B", "Chest", "2026-01-02T10:00:00Z", 80.0, 10);
            trained(user, "C", "Chest", "2026-01-03T10:00:00Z", 80.0, 10);

            mockMvc.perform(get(LIST_URL)
                    .param("sort", "NAME").param("direction", "ASC")
                    .param("page", "1").param("size", "2")
                    .header(HttpHeaders.AUTHORIZATION, bearer(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].name").value("C"))
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.size").value(2))
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.totalPages").value(2));
        }

        @Test
        @DisplayName("flags the pinned exercises")
        void shouldFlagPinned() throws Exception {
            UserDto user = createUser();
            String auth = bearer(user);
            Exercise squat = trained(user, "Squat", "Quadriceps", "2026-01-01T10:00:00Z", 80.0, 10);
            mockMvc.perform(put("/api/progress/pinned-exercises")
                    .header(HttpHeaders.AUTHORIZATION, auth)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"exerciseIds\":[\"" + squat.getId() + "\"]}"))
                .andExpect(status().isOk());

            mockMvc.perform(get(LIST_URL).header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(jsonPath("$.content[0].isPinned").value(true));
        }

        @Test
        @DisplayName("rejects an unknown sort and an invalid page")
        void shouldRejectInvalidParameters() throws Exception {
            String auth = bearer(createUser());

            mockMvc.perform(get(LIST_URL).param("sort", "password").header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(status().isBadRequest());
            mockMvc.perform(get(LIST_URL).param("size", "0").header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_PAGE"));
            mockMvc.perform(get(LIST_URL).param("size", "51").header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(status().isBadRequest());
            mockMvc.perform(get(LIST_URL).param("page", "-1").header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("series of one exercise")
    class SeriesOfOneExercise {

        @Test
        @DisplayName("buckets finished sets by day inside the range")
        void shouldBucketByDay() throws Exception {
            UserDto user = createUser();
            Exercise squat = createExercise(user.getId(), "Squat", "Quadriceps");
            WorkoutSession first = session(user.getId(), SessionStatus.FINISHED, "2026-03-02T13:00:00Z");
            addLog(first, squat, 1, 100.0, 5);
            addLog(first, squat, 2, 90.0, 8);
            WorkoutSession second = session(user.getId(), SessionStatus.FINISHED, "2026-03-05T13:00:00Z");
            addLog(second, squat, 1, 105.0, 5);
            WorkoutSession outside = session(user.getId(), SessionStatus.FINISHED, "2026-04-02T13:00:00Z");
            addLog(outside, squat, 1, 500.0, 5);
            WorkoutSession unfinished = session(user.getId(), SessionStatus.IN_PROGRESS, "2026-03-06T13:00:00Z");
            addLog(unfinished, squat, 1, 500.0, 5);

            mockMvc.perform(get(SERIES_URL, squat.getId())
                    .param("from", "2026-03-01T03:00:00Z")
                    .param("to", "2026-04-01T03:00:00Z")
                    .param("bucket", "DAY")
                    .header(HttpHeaders.AUTHORIZATION, bearer(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.exerciseId").value(squat.getId().toString()))
                .andExpect(jsonPath("$.name").value("Squat"))
                .andExpect(jsonPath("$.bucket").value("DAY"))
                .andExpect(jsonPath("$.points.length()").value(2))
                .andExpect(jsonPath("$.points[0].periodStart").value("2026-03-02T03:00:00Z"))
                .andExpect(jsonPath("$.points[0].sets").value(2))
                .andExpect(jsonPath("$.points[0].reps").value(13))
                .andExpect(jsonPath("$.points[0].maxWeight").value(100.0))
                .andExpect(jsonPath("$.points[0].volume").value(1220.0))
                .andExpect(jsonPath("$.points[0].bestE1rm").value(closeTo(116.6666666, 1e-6)))
                .andExpect(jsonPath("$.points[1].maxWeight").value(105.0))
                .andExpect(jsonPath("$.summary.sessionCount").value(2))
                .andExpect(jsonPath("$.summary.totalSets").value(3))
                .andExpect(jsonPath("$.summary.totalVolume").value(1745.0))
                .andExpect(jsonPath("$.summary.bestWeight").value(105.0))
                .andExpect(jsonPath("$.summary.lastPerformedAt").value("2026-03-05T13:00:00Z"));
        }

        @Test
        @DisplayName("groups weeks from Monday and months in the user's time zone")
        void shouldBucketWeeksAndMonthsInUserZone() throws Exception {
            UserDto user = createUser();
            userService.update(new UpdateUserDto(null, null, "Asia/Tokyo"), user.getId());
            Exercise squat = createExercise(user.getId(), "Squat", "Quadriceps");
            // 31/10 16:00Z já é 01/11 (domingo) 01:00 em Tóquio
            WorkoutSession lateOctoberUtc = session(user.getId(), SessionStatus.FINISHED, "2026-10-31T16:00:00Z");
            addLog(lateOctoberUtc, squat, 1, 100.0, 5);
            // 02/11 (segunda) 10:00 em Tóquio
            WorkoutSession monday = session(user.getId(), SessionStatus.FINISHED, "2026-11-02T01:00:00Z");
            addLog(monday, squat, 1, 100.0, 5);
            String auth = bearer(user);

            mockMvc.perform(get(SERIES_URL, squat.getId())
                    .param("from", "2026-10-01T00:00:00Z")
                    .param("to", "2026-12-01T00:00:00Z")
                    .param("bucket", "WEEK")
                    .header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.points.length()").value(2))
                // semana de segunda 26/10 em Tóquio = 25/10 15:00Z
                .andExpect(jsonPath("$.points[0].periodStart").value("2026-10-25T15:00:00Z"))
                .andExpect(jsonPath("$.points[1].periodStart").value("2026-11-01T15:00:00Z"));

            mockMvc.perform(get(SERIES_URL, squat.getId())
                    .param("from", "2026-10-01T00:00:00Z")
                    .param("to", "2026-12-01T00:00:00Z")
                    .param("bucket", "MONTH")
                    .header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(jsonPath("$.points.length()").value(1))
                .andExpect(jsonPath("$.points[0].periodStart").value("2026-10-31T15:00:00Z"))
                .andExpect(jsonPath("$.points[0].sets").value(2));
        }

        @Test
        @DisplayName("is empty, with an empty summary, when nothing was trained in the range")
        void shouldBeEmptyWithoutSets() throws Exception {
            UserDto user = createUser();
            Exercise squat = createExercise(user.getId(), "Squat", "Quadriceps");

            mockMvc.perform(get(SERIES_URL, squat.getId())
                    .param("from", "2026-03-01T00:00:00Z")
                    .param("to", "2026-04-01T00:00:00Z")
                    .param("bucket", "DAY")
                    .header(HttpHeaders.AUTHORIZATION, bearer(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.points").isEmpty())
                .andExpect(jsonPath("$.summary.sessionCount").value(0))
                .andExpect(jsonPath("$.summary.totalVolume").value(0.0))
                .andExpect(jsonPath("$.summary.bestWeight").doesNotExist())
                .andExpect(jsonPath("$.summary.lastPerformedAt").doesNotExist());
        }

        @Test
        @DisplayName("hides other users' exercises and validates the range")
        void shouldValidateRequest() throws Exception {
            UserDto user = createUser();
            Exercise foreign = createExercise(createUser().getId(), "Foreign", "Chest");
            Exercise own = createExercise(user.getId(), "Own", "Chest");
            String auth = bearer(user);

            mockMvc.perform(get(SERIES_URL, foreign.getId())
                    .param("from", "2026-03-01T00:00:00Z").param("to", "2026-04-01T00:00:00Z")
                    .param("bucket", "DAY")
                    .header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(status().isNotFound());

            mockMvc.perform(get(SERIES_URL, own.getId())
                    .param("from", "2026-04-01T00:00:00Z").param("to", "2026-03-01T00:00:00Z")
                    .param("bucket", "DAY")
                    .header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_RANGE"));

            mockMvc.perform(get(SERIES_URL, own.getId())
                    .param("from", "2026-03-01T00:00:00Z").param("to", "2026-04-01T00:00:00Z")
                    .param("bucket", "HOUR")
                    .header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(status().isBadRequest());
        }
    }

    private Exercise trained(
        UserDto user, String name, String muscle, String startedAt, double weight, int reps
    ) {
        Exercise exercise = createExercise(user.getId(), name, muscle);
        addLog(session(user.getId(), SessionStatus.FINISHED, startedAt), exercise, 1, weight, reps);
        return exercise;
    }

    private WorkoutSession session(UUID userId, SessionStatus status, String startedAt) {
        Instant start = Instant.parse(startedAt);
        WorkoutSession session = new WorkoutSession();
        session.setUserId(userId);
        session.setStartedAt(start);
        session.setEndedAt(status == SessionStatus.FINISHED ? start : null);
        session.setStatus(status);
        session.setTotalVolume(0.0);
        return sessions.save(session);
    }

    private void addLog(WorkoutSession session, Exercise exercise, int setNumber, double weight, int reps) {
        WorkoutLog log = new WorkoutLog();
        log.setClientLogId(UUID.randomUUID());
        log.setSetNumber(setNumber);
        log.setWeight(weight);
        log.setReps(reps);
        log.setIsPr(false);
        log.setExercise(exercise);
        log.setWorkoutSession(session);
        logs.save(log);
    }

    private Exercise createExercise(UUID userId, String name, String primaryMuscle) {
        Exercise exercise = new Exercise();
        exercise.setName(name);
        exercise.setPrimaryMuscle(primaryMuscle);
        exercise.setUserId(userId);
        return exercises.save(exercise);
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
