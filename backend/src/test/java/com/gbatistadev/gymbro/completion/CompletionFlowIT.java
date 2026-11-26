package com.gbatistadev.gymbro.completion;

import com.gbatistadev.gymbro.TestcontainersConfiguration;
import com.gbatistadev.gymbro.config.jwt.JwtService;
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
    @DisplayName("refuses to complete an archived routine with a domain error code")
    void shouldRejectArchivedRoutine() throws Exception {
        String auth = bearer(createUser());
        String playlistId = createPlaylist(auth, "Antiga");

        mockMvc.perform(post("/api/playlists/{id}/archive", playlistId).header(HttpHeaders.AUTHORIZATION, auth))
            .andExpect(status().isOk());

        mockMvc.perform(post("/api/playlists/{id}/completions", playlistId)
                .header(HttpHeaders.AUTHORIZATION, auth))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value("PLAYLIST_ARCHIVED"));
    }

    private String completeRoutine(String auth, String playlistId) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/playlists/{id}/completions", playlistId)
                .header(HttpHeaders.AUTHORIZATION, auth))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.playlistId").value(playlistId))
            .andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.id");
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
