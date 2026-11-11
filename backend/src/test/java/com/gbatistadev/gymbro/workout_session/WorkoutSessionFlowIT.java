package com.gbatistadev.gymbro.workout_session;

import com.gbatistadev.gymbro.TestcontainersConfiguration;
import com.gbatistadev.gymbro.config.jwt.JwtService;
import com.gbatistadev.gymbro.exercise.Exercise;
import com.gbatistadev.gymbro.exercise.ExerciseRepository;
import com.gbatistadev.gymbro.user.UserService;
import com.gbatistadev.gymbro.user.dto.CreateUserDto;
import com.gbatistadev.gymbro.user.dto.UserDto;
import com.jayway.jsonpath.JsonPath;
import org.springframework.http.HttpHeaders;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
@DisplayName("Workout session execution flow")
class WorkoutSessionFlowIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserService userService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ExerciseRepository exerciseRepository;

    @Test
    @DisplayName("open, log, replay, inspect, finish")
    void shouldRunFullLifecycle() throws Exception {
        UserDto user = createUser();
        String auth = bearer(user);
        Exercise exercise = createExercise();

        String sessionId = startSessionAndGetId(auth);

        addLog(sessionId, auth, UUID.randomUUID(), exercise.getId(), 100, 10)
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.setNumber").value(1))
            .andExpect(jsonPath("$.isPr").value(true));

        UUID clientId = UUID.randomUUID();
        MvcResult first = addLog(sessionId, auth, clientId, exercise.getId(), 100, 10)
            .andExpect(status().isCreated())
            .andReturn();
        String logId = JsonPath.read(first.getResponse().getContentAsString(), "$.id");

        addLog(sessionId, auth, clientId, exercise.getId(), 100, 10)
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(logId));

        addLog(sessionId, auth, UUID.randomUUID(), exercise.getId(), 100, 5)
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.setNumber").value(3));

        mockMvc.perform(get("/api/sessions/{id}", sessionId).header(HttpHeaders.AUTHORIZATION, auth))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalVolume").value(2500.0))
            .andExpect(jsonPath("$.exercises.length()").value(1))
            .andExpect(jsonPath("$.exercises[0].sets.length()").value(3));

        mockMvc.perform(get("/api/sessions/active").header(HttpHeaders.AUTHORIZATION, auth))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(sessionId));

        finish(sessionId, auth)
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("FINISHED"))
            .andExpect(jsonPath("$.totalVolume").value(2500.0))
            .andExpect(jsonPath("$.endedAt").exists());

        addLog(sessionId, auth, UUID.randomUUID(), exercise.getId(), 100, 5)
            .andExpect(status().isConflict());

        mockMvc.perform(get("/api/sessions/active").header(HttpHeaders.AUTHORIZATION, auth))
            .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/sessions").header(HttpHeaders.AUTHORIZATION, auth))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElements").value(1))
            .andExpect(jsonPath("$.content[0].id").value(sessionId));
    }

    @Test
    @DisplayName("PR is measured against previous sessions, not the current one")
    void shouldDetectPrAcrossSessions() throws Exception {
        UserDto user = createUser();
        String auth = bearer(user);
        Exercise exercise = createExercise();

        String firstSession = startSessionAndGetId(auth);
        addLog(firstSession, auth, UUID.randomUUID(), exercise.getId(), 100, 5)
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.isPr").value(true));
        finish(firstSession, auth).andExpect(status().isOk());

        String secondSession = startSessionAndGetId(auth);
        addLog(secondSession, auth, UUID.randomUUID(), exercise.getId(), 100, 4)
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.isPr").value(false));

        addLog(secondSession, auth, UUID.randomUUID(), exercise.getId(), 100, 8)
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.isPr").value(true));
    }

    @Test
    @DisplayName("only one open session, unique set numbers, delete recalculates volume")
    void shouldEnforceOpenSessionAndSetRules() throws Exception {
        UserDto user = createUser();
        String auth = bearer(user);
        Exercise exercise = createExercise();

        String sessionId = startSessionAndGetId(auth);
        startSession(auth, "{}")
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value("SESSION_ALREADY_ACTIVE"));

        MvcResult first = addLog(sessionId, auth, UUID.randomUUID(), exercise.getId(), 50, 10, 1)
            .andExpect(status().isCreated())
            .andReturn();
        String logId = JsonPath.read(first.getResponse().getContentAsString(), "$.id");

        addLog(sessionId, auth, UUID.randomUUID(), exercise.getId(), 50, 10, 1)
            .andExpect(status().isConflict());

        mockMvc.perform(delete("/api/sessions/{id}/logs/{logId}", sessionId, logId).header(HttpHeaders.AUTHORIZATION, auth))
            .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/sessions/{id}", sessionId).header(HttpHeaders.AUTHORIZATION, auth))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalVolume").value(0.0));

        addLog(sessionId, auth, UUID.randomUUID(), exercise.getId(), 50, 10, 1)
            .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("sessions and logs are scoped to the authenticated user")
    void shouldIsolateSessionsBetweenUsers() throws Exception {
        UserDto owner = createUser();
        UserDto other = createUser();
        String ownerAuth = bearer(owner);
        String otherAuth = bearer(other);
        Exercise exercise = createExercise();

        String sessionId = startSessionAndGetId(ownerAuth);

        addLog(sessionId, otherAuth, UUID.randomUUID(), exercise.getId(), 40, 10)
            .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/sessions/{id}", sessionId).header(HttpHeaders.AUTHORIZATION, otherAuth))
            .andExpect(status().isNotFound());
        finish(sessionId, otherAuth)
            .andExpect(status().isNotFound());

        startSession(otherAuth, "{\"playlistId\":\"" + UUID.randomUUID() + "\"}")
            .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("startedAt cannot be in the future")
    void shouldRejectFutureStart() throws Exception {
        UserDto user = createUser();
        String auth = bearer(user);
        String future = Instant.now().plus(1, ChronoUnit.HOURS).toString();

        startSession(auth, "{\"startedAt\":\"" + future + "\"}")
            .andExpect(status().isBadRequest());
    }

    private ResultActions startSession(String auth, String body) throws Exception {
        return mockMvc.perform(post("/api/sessions")
            .header(HttpHeaders.AUTHORIZATION, auth)
            .contentType(MediaType.APPLICATION_JSON)
            .content(body));
    }

    private String startSessionAndGetId(String auth) throws Exception {
        MvcResult result = startSession(auth, "{}")
            .andExpect(status().isCreated())
            .andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.id");
    }

    private ResultActions addLog(
        String sessionId,
        String auth,
        UUID clientLogId,
        UUID exerciseId,
        double weight,
        int reps
    ) throws Exception {
        String body = """
            {"clientLogId":"%s","exerciseId":"%s","weight":%s,"reps":%d}
            """.formatted(clientLogId, exerciseId, weight, reps);

        return mockMvc.perform(post("/api/sessions/{id}/logs", sessionId)
            .header(HttpHeaders.AUTHORIZATION, auth)
            .contentType(MediaType.APPLICATION_JSON)
            .content(body));
    }

    private ResultActions addLog(
        String sessionId,
        String auth,
        UUID clientLogId,
        UUID exerciseId,
        double weight,
        int reps,
        int setNumber
    ) throws Exception {
        String body = """
            {"clientLogId":"%s","exerciseId":"%s","weight":%s,"reps":%d,"setNumber":%d}
            """.formatted(clientLogId, exerciseId, weight, reps, setNumber);

        return mockMvc.perform(post("/api/sessions/{id}/logs", sessionId)
            .header(HttpHeaders.AUTHORIZATION, auth)
            .contentType(MediaType.APPLICATION_JSON)
            .content(body));
    }

    private ResultActions finish(String sessionId, String auth) throws Exception {
        return mockMvc.perform(patch("/api/sessions/{id}", sessionId)
            .header(HttpHeaders.AUTHORIZATION, auth)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"status\":\"FINISHED\"}"));
    }

    private UserDto createUser() {
        return userService.create(new CreateUserDto(
            "User",
            "u" + UUID.randomUUID().toString().substring(0, 8),
            "user-" + UUID.randomUUID() + "@example.com",
            "password123"
        ));
    }

    private Exercise createExercise() {
        Exercise exercise = new Exercise();
        exercise.setName("Exercise-" + UUID.randomUUID());
        exercise.setPrimaryMuscle("chest");
        exercise.setSecondaryMuscle("triceps");
        return exerciseRepository.save(exercise);
    }

    private String bearer(UserDto user) {
        return "Bearer " + jwtService.createAccessToken(user.getId(), user.getEmail());
    }
}
