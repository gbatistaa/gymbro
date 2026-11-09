package com.gbatistadev.gymbro.playlist;

import com.gbatistadev.gymbro.TestcontainersConfiguration;
import com.gbatistadev.gymbro.config.jwt.JwtService;
import com.gbatistadev.gymbro.exercise.Exercise;
import com.gbatistadev.gymbro.exercise.ExerciseRepository;
import com.gbatistadev.gymbro.user.UserService;
import com.gbatistadev.gymbro.user.dto.CreateUserDto;
import com.gbatistadev.gymbro.user.dto.UserDto;
import com.jayway.jsonpath.JsonPath;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
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
        Cookie cookie = accessCookie(createUser());
        Exercise supino = createExercise("Supino");
        Exercise agachamento = createExercise("Agachamento");
        Exercise remada = createExercise("Remada");

        String playlistId = createPlaylist(cookie, "Push");

        String first = addExercise(cookie, playlistId, supino, 3);
        String second = addExercise(cookie, playlistId, agachamento, 4);
        String third = addExercise(cookie, playlistId, remada, 3);

        mockMvc.perform(get("/api/playlists/{id}", playlistId).cookie(cookie))
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
                .cookie(cookie)
                .contentType(MediaType.APPLICATION_JSON)
                .content(reorder))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.exercises[0].id").value(third))
            .andExpect(jsonPath("$.exercises[2].id").value(first));

        mockMvc.perform(patch("/api/playlists/{id}/exercises/{itemId}", playlistId, first)
                .cookie(cookie)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"targetSets\":5}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.targetSets").value(5))
            .andExpect(jsonPath("$.targetRepsMin").value(8));

        MvcResult cloneResult = mockMvc.perform(post("/api/playlists/{id}/clone", playlistId)
                .cookie(cookie))
            .andExpect(status().isCreated())
            .andReturn();
        String cloneId = JsonPath.read(
            cloneResult.getResponse().getContentAsString(), "$.id");

        mockMvc.perform(get("/api/playlists/{id}", cloneId).cookie(cookie))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Push (cópia)"))
            .andExpect(jsonPath("$.exercises.length()").value(3));

        mockMvc.perform(post("/api/playlists/{id}/archive", playlistId).cookie(cookie))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.archivedAt").exists());

        mockMvc.perform(post("/api/playlists/{id}/exercises", playlistId)
                .cookie(cookie)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"exerciseId":"%s","targetSets":3}
                    """.formatted(supino.getId())))
            .andExpect(status().isConflict());

        mockMvc.perform(get("/api/playlists").cookie(cookie))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[*].id", not(hasItem(playlistId))))
            .andExpect(jsonPath("$[*].id", hasItem(cloneId)));

        mockMvc.perform(get("/api/playlists")
                .param("includeArchived", "true")
                .cookie(cookie))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[*].id", hasItem(playlistId)));
    }

    @Test
    @DisplayName("a routine is invisible to other users")
    void shouldIsolatePlaylistsBetweenUsers() throws Exception {
        Cookie owner = accessCookie(createUser());
        Cookie other = accessCookie(createUser());
        Exercise exercise = createExercise("Supino");
        String playlistId = createPlaylist(owner, "Push");

        mockMvc.perform(get("/api/playlists/{id}", playlistId).cookie(other))
            .andExpect(status().isNotFound());

        mockMvc.perform(post("/api/playlists/{id}/exercises", playlistId)
                .cookie(other)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"exerciseId":"%s","targetSets":3}
                    """.formatted(exercise.getId())))
            .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("a workout session can start from a routine")
    void shouldStartSessionFromPlaylist() throws Exception {
        Cookie cookie = accessCookie(createUser());
        Exercise exercise = createExercise("Supino");
        String playlistId = createPlaylist(cookie, "Push");
        addExercise(cookie, playlistId, exercise, 3);

        mockMvc.perform(post("/api/sessions")
                .cookie(cookie)
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
        Cookie cookie = accessCookie(createUser());

        mockMvc.perform(get("/api/exercises")
                .param("q", "Supino reto")
                .param("muscle", "Peito")
                .cookie(cookie))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElements").value(1))
            .andExpect(jsonPath("$.content[0].name").value("Supino reto"));
    }

    private Cookie accessCookie(UserDto user) {
        return new Cookie("access_token", jwtService.createAccessToken(user.getId(), user.getEmail()));
    }

    private UserDto createUser() {
        return userService.create(new CreateUserDto(
            "User",
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

    private String createPlaylist(Cookie cookie, String name) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/playlists")
                .cookie(cookie)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name":"%s","description":"test"}
                    """.formatted(name)))
            .andExpect(status().isCreated())
            .andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.id");
    }

    private String addExercise(
        Cookie cookie, String playlistId, Exercise exercise, int targetSets
    ) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/playlists/{id}/exercises", playlistId)
                .cookie(cookie)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"exerciseId":"%s","targetSets":%d,"targetRepsMin":8,"targetRepsMax":12,"restSeconds":90}
                    """.formatted(exercise.getId(), targetSets)))
            .andExpect(status().isCreated())
            .andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.id");
    }
}
