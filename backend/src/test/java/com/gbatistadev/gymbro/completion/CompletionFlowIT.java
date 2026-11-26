package com.gbatistadev.gymbro.completion;

import com.gbatistadev.gymbro.TestcontainersConfiguration;
import com.gbatistadev.gymbro.config.jwt.JwtService;
import com.gbatistadev.gymbro.exercise.Exercise;
import com.gbatistadev.gymbro.exercise.ExerciseRepository;
import com.gbatistadev.gymbro.user.UserService;
import com.gbatistadev.gymbro.user.dto.CreateUserDto;
import com.gbatistadev.gymbro.user.dto.UserDto;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
@DisplayName("Workout completion flow")
class CompletionFlowIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserService userService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ExerciseRepository exerciseRepository;

    @Test
    @DisplayName("logs the exercises done with a plan and feeds volume and PRs on the dashboard")
    void shouldLogExercisesAndFeedDashboard() throws Exception {
        String auth = bearer(createUser());
        Exercise bench = createExercise("Bench");
        String playlistId = createPlaylist(auth, "Upper");

        String body = """
            {"exercises":[{"exerciseId":"%s","sets":2,"reps":8,"weightKg":40}]}
            """.formatted(bench.getId());

        MvcResult result = mockMvc.perform(post("/api/playlists/{id}/completions", playlistId)
                .header(HttpHeaders.AUTHORIZATION, auth)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.loggedSets").value(2))
            .andExpect(jsonPath("$.totalVolume").value(640.0))
            .andReturn();
        String completionId = JsonPath.read(result.getResponse().getContentAsString(), "$.id");

        mockMvc.perform(get("/api/dashboard").param("weeks", "1").header(HttpHeaders.AUTHORIZATION, auth))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.weeks[0].sessions").value(1))
            .andExpect(jsonPath("$.weeks[0].volume").value(640.0))
            .andExpect(jsonPath("$.recentPrs.length()").value(1));

        mockMvc.perform(delete("/api/completions/{id}", completionId).header(HttpHeaders.AUTHORIZATION, auth))
            .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/dashboard").param("weeks", "1").header(HttpHeaders.AUTHORIZATION, auth))
            .andExpect(jsonPath("$.weeks[0].sessions").value(0))
            .andExpect(jsonPath("$.weeks[0].volume").value(0.0));
    }

    @Test
    @DisplayName("rejects a logged exercise with invalid sets")
    void shouldValidateLoggedExercises() throws Exception {
        String auth = bearer(createUser());
        Exercise squat = createExercise("Squat");
        String playlistId = createPlaylist(auth, "Legs");

        mockMvc.perform(post("/api/playlists/{id}/completions", playlistId)
                .header(HttpHeaders.AUTHORIZATION, auth)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"exercises":[{"exerciseId":"%s","sets":0,"reps":8,"weightKg":40}]}
                    """.formatted(squat.getId())))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    @DisplayName("creates a plan already listing exercises with weight, sets, reps and muscle")
    void shouldCreatePlanWithExercises() throws Exception {
        String auth = bearer(createUser());
        Exercise row = createExercise("Row");

        MvcResult created = mockMvc.perform(post("/api/playlists")
                .header(HttpHeaders.AUTHORIZATION, auth)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name":"Pull","exercises":[
                      {"exerciseId":"%s","targetSets":4,"targetRepsMin":10,"targetRepsMax":10,"targetWeightKg":55}
                    ]}
                    """.formatted(row.getId())))
            .andExpect(status().isCreated())
            .andReturn();
        String playlistId = JsonPath.read(created.getResponse().getContentAsString(), "$.id");

        mockMvc.perform(get("/api/playlists").header(HttpHeaders.AUTHORIZATION, auth))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(playlistId))
            .andExpect(jsonPath("$[0].exercises[0].targetSets").value(4))
            .andExpect(jsonPath("$[0].exercises[0].targetWeightKg").value(55.0))
            .andExpect(jsonPath("$[0].exercises[0].primaryMuscle").value("Costas"));
    }

    @Test
    @DisplayName("marks a routine as done, counts it in the summary and undoes a mistake")
    void shouldRecordAndCountCompletions() throws Exception {
        String auth = bearer(createUser());
        String playlistId = createPlaylist(auth, "Push");

        String completionId = completeRoutine(auth, playlistId);

        mockMvc.perform(get("/api/completions/summary").header(HttpHeaders.AUTHORIZATION, auth))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalCount").value(1))
            .andExpect(jsonPath("$.thisWeekCount").value(1));

        mockMvc.perform(get("/api/completions").header(HttpHeaders.AUTHORIZATION, auth))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(1))
            .andExpect(jsonPath("$[0].playlistId").value(playlistId))
            .andExpect(jsonPath("$[0].playlistName").value("Push"));

        mockMvc.perform(delete("/api/completions/{id}", completionId).header(HttpHeaders.AUTHORIZATION, auth))
            .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/completions/summary").header(HttpHeaders.AUTHORIZATION, auth))
            .andExpect(jsonPath("$.totalCount").value(0))
            .andExpect(jsonPath("$.thisWeekCount").value(0));
    }

    @Test
    @DisplayName("shows the last completion date on the routine list")
    void shouldExposeLastPerformedAtOnRoutineList() throws Exception {
        String auth = bearer(createUser());
        String playlistId = createPlaylist(auth, "Pull");

        completeRoutine(auth, playlistId);

        mockMvc.perform(get("/api/playlists").header(HttpHeaders.AUTHORIZATION, auth))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].lastPerformedAt").isNotEmpty());
    }

    @Test
    @DisplayName("refuses to complete a routine that belongs to another user")
    void shouldHideRoutinesFromOtherUsers() throws Exception {
        String owner = bearer(createUser());
        String intruder = bearer(createUser());
        String playlistId = createPlaylist(owner, "Legs");

        mockMvc.perform(post("/api/playlists/{id}/completions", playlistId)
                .header(HttpHeaders.AUTHORIZATION, intruder))
            .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("deletes a routine and its done markers, keeping the logged workout history")
    void shouldDeleteRoutineKeepingHistory() throws Exception {
        String auth = bearer(createUser());
        Exercise bench = createExercise("Bench");
        String playlistId = createPlaylist(auth, "Doomed");

        mockMvc.perform(post("/api/playlists/{id}/completions", playlistId)
                .header(HttpHeaders.AUTHORIZATION, auth)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"exercises":[{"exerciseId":"%s","sets":2,"reps":5,"weightKg":50}]}
                    """.formatted(bench.getId())))
            .andExpect(status().isCreated());

        mockMvc.perform(delete("/api/playlists/{id}", playlistId).header(HttpHeaders.AUTHORIZATION, auth))
            .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/playlists/{id}", playlistId).header(HttpHeaders.AUTHORIZATION, auth))
            .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/completions").header(HttpHeaders.AUTHORIZATION, auth))
            .andExpect(jsonPath("$.length()").value(0));
        mockMvc.perform(get("/api/dashboard").param("weeks", "1").header(HttpHeaders.AUTHORIZATION, auth))
            .andExpect(jsonPath("$.weeks[0].volume").value(500.0));
    }

    private String completeRoutine(String auth, String playlistId) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/playlists/{id}/completions", playlistId)
                .header(HttpHeaders.AUTHORIZATION, auth))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.playlistId").value(playlistId))
            .andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.id");
    }

    private Exercise createExercise(String prefix) {
        Exercise exercise = new Exercise();
        exercise.setName(prefix + "-" + UUID.randomUUID());
        exercise.setPrimaryMuscle("Costas");
        return exerciseRepository.save(exercise);
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

    private String createPlaylist(String auth, String name) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/playlists")
                .header(HttpHeaders.AUTHORIZATION, auth)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name":"%s","description":"test"}
                    """.formatted(name)))
            .andExpect(status().isCreated())
            .andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.id");
    }
}
