package com.gbatistadev.gymbro.playlist;

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

import java.util.UUID;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
@DisplayName("Playlist flow")
class PlaylistFlowIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserService userService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ExerciseRepository exerciseRepository;

    @Test
    @DisplayName("create, add, reorder, update, clone and archive a routine")
    void shouldRunRoutineLifecycle() throws Exception {
        String auth = bearer(createUser());
        Exercise supino = createExercise("Supino");
        Exercise agachamento = createExercise("Agachamento");
        Exercise remada = createExercise("Remada");

        String playlistId = createPlaylist(auth, "Push");

        String first = addExercise(auth, playlistId, supino, 3);
        String second = addExercise(auth, playlistId, agachamento, 4);
        String third = addExercise(auth, playlistId, remada, 3);

        mockMvc.perform(get("/api/playlists/{id}", playlistId).header(HttpHeaders.AUTHORIZATION, auth))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.exercises.length()").value(3))
            .andExpect(jsonPath("$.exercises[0].id").value(first))
            .andExpect(jsonPath("$.exercises[0].orderIndex").value(0))
            .andExpect(jsonPath("$.exercises[0].targetRepsMin").value(8))
            .andExpect(jsonPath("$.exercises[0].targetRepsMax").value(12));

        String reorder = """
            {"items":[
              {"playlistExerciseId":"%s","orderIndex":0},
              {"playlistExerciseId":"%s","orderIndex":1},
              {"playlistExerciseId":"%s","orderIndex":2}
            ]}
            """.formatted(third, second, first);

        mockMvc.perform(put("/api/playlists/{id}/order", playlistId)
                .header(HttpHeaders.AUTHORIZATION, auth)
                .contentType(MediaType.APPLICATION_JSON)
                .content(reorder))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.exercises[0].id").value(third))
            .andExpect(jsonPath("$.exercises[2].id").value(first));

        mockMvc.perform(patch("/api/playlists/{id}/exercises/{itemId}", playlistId, first)
                .header(HttpHeaders.AUTHORIZATION, auth)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"targetSets\":5}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.targetSets").value(5))
            .andExpect(jsonPath("$.targetRepsMin").value(8));

        MvcResult cloneResult = mockMvc.perform(post("/api/playlists/{id}/clone", playlistId)
                .header(HttpHeaders.AUTHORIZATION, auth))
            .andExpect(status().isCreated())
            .andReturn();
        String cloneId = JsonPath.read(
            cloneResult.getResponse().getContentAsString(), "$.id");

        mockMvc.perform(get("/api/playlists/{id}", cloneId).header(HttpHeaders.AUTHORIZATION, auth))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Push (cópia)"))
            .andExpect(jsonPath("$.exercises.length()").value(3));

        mockMvc.perform(post("/api/playlists/{id}/archive", playlistId).header(HttpHeaders.AUTHORIZATION, auth))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.archivedAt").exists());

        mockMvc.perform(post("/api/playlists/{id}/exercises", playlistId)
                .header(HttpHeaders.AUTHORIZATION, auth)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"exerciseId":"%s","targetSets":3}
                    """.formatted(supino.getId())))
            .andExpect(status().isConflict());

        mockMvc.perform(get("/api/playlists").header(HttpHeaders.AUTHORIZATION, auth))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[*].id", not(hasItem(playlistId))))
            .andExpect(jsonPath("$[*].id", hasItem(cloneId)));

        mockMvc.perform(get("/api/playlists")
                .param("includeArchived", "true")
                .header(HttpHeaders.AUTHORIZATION, auth))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[*].id", hasItem(playlistId)));
    }

    @Test
    @DisplayName("a routine is invisible to other users")
    void shouldIsolatePlaylistsBetweenUsers() throws Exception {
        String owner = bearer(createUser());
        String other = bearer(createUser());
        Exercise exercise = createExercise("Supino");
        String playlistId = createPlaylist(owner, "Push");

        mockMvc.perform(get("/api/playlists/{id}", playlistId).header(HttpHeaders.AUTHORIZATION, other))
            .andExpect(status().isNotFound());

        mockMvc.perform(post("/api/playlists/{id}/exercises", playlistId)
                .header(HttpHeaders.AUTHORIZATION, other)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"exerciseId":"%s","targetSets":3}
                    """.formatted(exercise.getId())))
            .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("a workout session can start from a routine")
    void shouldStartSessionFromPlaylist() throws Exception {
        String auth = bearer(createUser());
        Exercise exercise = createExercise("Supino");
        String playlistId = createPlaylist(auth, "Push");
        addExercise(auth, playlistId, exercise, 3);

        mockMvc.perform(post("/api/sessions")
                .header(HttpHeaders.AUTHORIZATION, auth)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"playlistId":"%s"}
                    """.formatted(playlistId)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.playlistId").value(playlistId))
            .andExpect(jsonPath("$.status").value("IN_PROGRESS"));
    }

    @Test
    @DisplayName("search finds a seeded global exercise")
    void shouldFindSeededExercise() throws Exception {
        String auth = bearer(createUser());

        mockMvc.perform(get("/api/exercises")
                .param("q", "Supino reto")
                .param("muscle", "Peito")
                .header(HttpHeaders.AUTHORIZATION, auth))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElements").value(1))
            .andExpect(jsonPath("$.content[0].name").value("Supino reto"));
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

    private Exercise createExercise(String prefix) {
        Exercise exercise = new Exercise();
        exercise.setName(prefix + "-" + UUID.randomUUID());
        exercise.setPrimaryMuscle("Peito");
        exercise.setSecondaryMuscle("Tríceps");
        return exerciseRepository.save(exercise);
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

    private String addExercise(
        String auth, String playlistId, Exercise exercise, int targetSets
    ) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/playlists/{id}/exercises", playlistId)
                .header(HttpHeaders.AUTHORIZATION, auth)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"exerciseId":"%s","targetSets":%d,"targetRepsMin":8,"targetRepsMax":12,"restSeconds":90}
                    """.formatted(exercise.getId(), targetSets)))
            .andExpect(status().isCreated())
            .andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.id");
    }
}
