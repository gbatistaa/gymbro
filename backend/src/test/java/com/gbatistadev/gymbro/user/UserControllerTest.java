package com.gbatistadev.gymbro.user;

import com.gbatistadev.gymbro.TestcontainersConfiguration;
import com.jayway.jsonpath.JsonPath;
import com.gbatistadev.gymbro.config.jwt.JwtService;
import com.gbatistadev.gymbro.user.dto.CreateUserDto;
import com.gbatistadev.gymbro.user.dto.UserDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
@DisplayName("UserController test class")
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserService userService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    @DisplayName("GET /api/users/me without an Authorization header returns standard 401")
    void shouldRejectRequestWithoutAuthorization() throws Exception {
        mockMvc.perform(get("/api/users/me"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.status").value(401))
            .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"))
            .andExpect(jsonPath("$.message").value("Authentication required"))
            .andExpect(jsonPath("$.path").value("/api/users/me"));
    }

    @Test
    @DisplayName("GET /api/users/me returns summary for a valid bearer token")
    void shouldReturnCurrentUserSummary() throws Exception {
        String email = "user-" + UUID.randomUUID() + "@example.com";
        UserDto user = userService.create(new CreateUserDto("Test User", "u" + UUID.randomUUID().toString().substring(0, 8), email, "password123"));

        mockMvc.perform(get("/api/users/me").header(HttpHeaders.AUTHORIZATION, bearer(user)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(user.getId().toString()))
            .andExpect(jsonPath("$.name").value("Test User"))
            .andExpect(jsonPath("$.email").value(email))
            .andExpect(jsonPath("$.username").value(user.getUsername()))
            .andExpect(jsonPath("$.createdAt").exists())
            .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    @DisplayName("PUT /api/users/me updates only provided fields")
    void shouldUpdateCurrentUser() throws Exception {
        String email = "user-" + UUID.randomUUID() + "@example.com";
        UserDto user = userService.create(new CreateUserDto("Test User", "u" + UUID.randomUUID().toString().substring(0, 8), email, "password123"));

        mockMvc.perform(put("/api/users/me")
                .header(HttpHeaders.AUTHORIZATION, bearer(user))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Updated Name\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Updated Name"))
            .andExpect(jsonPath("$.email").value(email));
    }

    @Test
    @DisplayName("PUT /api/users/me accepts an email-only partial update")
    void shouldUpdateOnlyEmail() throws Exception {
        String email = "user-" + UUID.randomUUID() + "@example.com";
        UserDto user = userService.create(new CreateUserDto("Test User", "u" + UUID.randomUUID().toString().substring(0, 8), email, "password123"));
        String updatedEmail = "updated-" + UUID.randomUUID() + "@example.com";

        mockMvc.perform(put("/api/users/me")
                .header(HttpHeaders.AUTHORIZATION, bearer(user))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + updatedEmail + "\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Test User"))
            .andExpect(jsonPath("$.email").value(updatedEmail));
    }

    @Test
    @DisplayName("invalid bearer token returns standard 401")
    void shouldRejectInvalidToken() throws Exception {
        mockMvc.perform(get("/api/users/me").header(HttpHeaders.AUTHORIZATION, "Bearer not-a-jwt"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.status").value(401))
            .andExpect(jsonPath("$.path").value("/api/users/me"));
    }

    @Test
    @DisplayName("a malformed Authorization header without the Bearer scheme returns 401")
    void shouldRejectHeaderWithoutBearerScheme() throws Exception {
        String email = "user-" + UUID.randomUUID() + "@example.com";
        UserDto user = userService.create(new CreateUserDto("Test User", "u" + UUID.randomUUID().toString().substring(0, 8), email, "password123"));

        mockMvc.perform(get("/api/users/me")
                .header(HttpHeaders.AUTHORIZATION, jwtService.createAccessToken(user.getId(), user.getEmail())))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("the Bearer scheme is matched case-insensitively")
    void shouldAcceptLowerCaseBearerScheme() throws Exception {
        String email = "user-" + UUID.randomUUID() + "@example.com";
        UserDto user = userService.create(new CreateUserDto("Test User", "u" + UUID.randomUUID().toString().substring(0, 8), email, "password123"));

        mockMvc.perform(get("/api/users/me")
                .header(HttpHeaders.AUTHORIZATION, "bearer " + jwtService.createAccessToken(user.getId(), user.getEmail())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(user.getId().toString()));
    }

    @Test
    @DisplayName("PUT /api/users/me updates the time zone and GET returns it")
    void shouldUpdateTimeZone() throws Exception {
        String email = "user-" + UUID.randomUUID() + "@example.com";
        UserDto user = userService.create(new CreateUserDto("Test User", "u" + UUID.randomUUID().toString().substring(0, 8), email, "password123"));

        mockMvc.perform(put("/api/users/me")
                .header(HttpHeaders.AUTHORIZATION, bearer(user))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"timezone\":\"Europe/Lisbon\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.timezone").value("Europe/Lisbon"));

        mockMvc.perform(get("/api/users/me").header(HttpHeaders.AUTHORIZATION, bearer(user)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.timezone").value("Europe/Lisbon"));
    }

    @Test
    @DisplayName("an invalid time zone returns VALIDATION_FAILED naming the field")
    void shouldRejectInvalidTimeZone() throws Exception {
        String email = "user-" + UUID.randomUUID() + "@example.com";
        UserDto user = userService.create(new CreateUserDto("Test User", "u" + UUID.randomUUID().toString().substring(0, 8), email, "password123"));

        mockMvc.perform(put("/api/users/me")
                .header(HttpHeaders.AUTHORIZATION, bearer(user))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"timezone\":\"Mars/Olympus_Mons\"}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
            .andExpect(jsonPath("$.errors[*].field").value("timezone"));
    }

    @Test
    @DisplayName("DELETE /api/users/me removes the account and cascades to dependent rows")
    void shouldDeleteAccount() throws Exception {
        String email = "user-" + UUID.randomUUID() + "@example.com";
        UserDto user = userService.create(new CreateUserDto("Test User", "u" + UUID.randomUUID().toString().substring(0, 8), email, "password123"));

        // o login cria uma linha em refresh_tokens: é a prova de que a cascata do banco rodou
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"identifier\":\"" + email + "\",\"password\":\"password123\"}"))
            .andExpect(status().isOk());
        assertEquals(1, refreshTokenRepository.findAllByUserId(user.getId()).size());

        mockMvc.perform(delete("/api/users/me").header(HttpHeaders.AUTHORIZATION, bearer(user)))
            .andExpect(status().isNoContent());

        assertTrue(refreshTokenRepository.findAllByUserId(user.getId()).isEmpty(),
            "a conta apagada não pode deixar refresh token órfão");
    }

    @Test
    @DisplayName("after deletion the same credentials are rejected with 401")
    void shouldRejectDeletedAccount() throws Exception {
        String email = "user-" + UUID.randomUUID() + "@example.com";
        UserDto user = userService.create(new CreateUserDto("Test User", "u" + UUID.randomUUID().toString().substring(0, 8), email, "password123"));
        String auth = bearer(user);

        mockMvc.perform(delete("/api/users/me").header(HttpHeaders.AUTHORIZATION, auth))
            .andExpect(status().isNoContent());

        // o JWT continua parseável (stateless), mas a identidade não existe mais
        mockMvc.perform(delete("/api/users/me").header(HttpHeaders.AUTHORIZATION, auth))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
    }

    @Test
    @DisplayName("deleting the account cascades to playlists, sessions, logs and custom exercises")
    void shouldCascadeToWorkoutData() throws Exception {
        String email = "cascade-" + UUID.randomUUID() + "@example.com";
        UserDto user = userService.create(new CreateUserDto("Cascade User", "u" + UUID.randomUUID().toString().substring(0, 8), email, "password123"));
        String auth = bearer(user);
        UUID userId = user.getId();

        String exerciseId = JsonPath.read(mockMvc.perform(post("/api/exercises")
                .header(HttpHeaders.AUTHORIZATION, auth)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Cascade Press " + UUID.randomUUID() + "\",\"primaryMuscle\":\"CHEST\"}"))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString(), "$.id");

        String playlistId = JsonPath.read(mockMvc.perform(post("/api/playlists")
                .header(HttpHeaders.AUTHORIZATION, auth)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Cascade Playlist\"}"))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString(), "$.id");

        mockMvc.perform(post("/api/playlists/{id}/exercises", playlistId)
                .header(HttpHeaders.AUTHORIZATION, auth)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"exerciseId\":\"" + exerciseId + "\",\"targetSets\":3}"))
            .andExpect(status().isCreated());

        String sessionId = JsonPath.read(mockMvc.perform(post("/api/sessions")
                .header(HttpHeaders.AUTHORIZATION, auth)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"playlistId\":\"" + playlistId + "\"}"))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString(), "$.id");

        mockMvc.perform(post("/api/sessions/{id}/logs", sessionId)
                .header(HttpHeaders.AUTHORIZATION, auth)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"clientLogId":"%s","exerciseId":"%s","weight":100.0,"reps":8,"setNumber":1}
                    """.formatted(UUID.randomUUID(), exerciseId)))
            .andExpect(status().isCreated());

        mockMvc.perform(delete("/api/users/me").header(HttpHeaders.AUTHORIZATION, auth))
            .andExpect(status().isNoContent());

        assertEquals(0, count("SELECT count(*) FROM playlists WHERE user_id = ?", userId));
        assertEquals(0, count("SELECT count(*) FROM playlist_exercise WHERE playlist_id = ?", UUID.fromString(playlistId)));
        assertEquals(0, count("SELECT count(*) FROM workout_session WHERE user_id = ?", userId));
        assertEquals(0, count("SELECT count(*) FROM workout_log WHERE workout_session_id = ?", UUID.fromString(sessionId)));
        assertEquals(0, count("SELECT count(*) FROM exercises WHERE user_id = ?", userId));
    }

    private int count(String sql, UUID argument) {
        return jdbcTemplate.queryForObject(sql, Integer.class, argument);
    }

    @Test
    @DisplayName("other API routes are protected too")
    void shouldProtectExerciseRoutes() throws Exception {
        mockMvc.perform(get("/api/exercises"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.status").value(401))
            .andExpect(jsonPath("$.path").value("/api/exercises"));
    }

    @Test
    @DisplayName("PUT /api/users/me/password changes the password and revokes every session")
    void shouldChangePasswordAndRevokeSessions() throws Exception {
        String email = "pw-" + UUID.randomUUID() + "@example.com";
        String username = "u" + UUID.randomUUID().toString().substring(0, 8);
        UserDto user = userService.create(new CreateUserDto("Test User", username, email, "password123"));

        // abre uma sessão para provar que a troca derruba o refresh token
        MvcResult login = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"identifier\":\"" + email + "\",\"password\":\"password123\"}"))
            .andExpect(status().isOk())
            .andReturn();
        assertEquals(1, refreshTokenRepository.findAllByUserId(user.getId()).size());
        String refreshCookie = login.getResponse().getHeaders("Set-Cookie").stream()
            .filter(header -> header.startsWith("gymbro_refresh="))
            .findFirst()
            .orElseThrow(() -> new AssertionError("cookie de refresh ausente"));

        mockMvc.perform(put("/api/users/me/password")
                .header(HttpHeaders.AUTHORIZATION, bearer(user))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"currentPassword\":\"password123\",\"newPassword\":\"new-password-456\"}"))
            .andExpect(status().isNoContent());

        assertTrue(refreshTokenRepository.findAllByUserId(user.getId()).isEmpty(),
            "a troca de senha precisa derrubar todas as sessões");

        // senha antiga não entra mais; a nova entra
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"identifier\":\"" + email + "\",\"password\":\"password123\"}"))
            .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"identifier\":\"" + email + "\",\"password\":\"new-password-456\"}"))
            .andExpect(status().isOk());

        // o refresh antigo morreu junto com a sessão
        mockMvc.perform(post("/api/auth/refresh").header("Cookie", refreshCookie.split(";")[0]))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("PUT /api/users/me/password with the wrong current password returns 400, never 401")
    void shouldRejectPasswordChange_whenCurrentPasswordIsWrong() throws Exception {
        String email = "pw-wrong-" + UUID.randomUUID() + "@example.com";
        UserDto user = userService.create(
            new CreateUserDto("Test User", "u" + UUID.randomUUID().toString().substring(0, 8), email, "password123"));

        mockMvc.perform(put("/api/users/me/password")
                .header(HttpHeaders.AUTHORIZATION, bearer(user))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"currentPassword\":\"not-the-password\",\"newPassword\":\"new-password-456\"}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("INVALID_CURRENT_PASSWORD"));

        // a sessão continua válida: 401 aqui significaria deslogar o usuário à toa
        mockMvc.perform(get("/api/users/me").header(HttpHeaders.AUTHORIZATION, bearer(user)))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("PUT /api/users/me/password with a short password returns field errors")
    void shouldRejectShortNewPassword() throws Exception {
        String email = "pw-short-" + UUID.randomUUID() + "@example.com";
        UserDto user = userService.create(
            new CreateUserDto("Test User", "u" + UUID.randomUUID().toString().substring(0, 8), email, "password123"));

        mockMvc.perform(put("/api/users/me/password")
                .header(HttpHeaders.AUTHORIZATION, bearer(user))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"currentPassword\":\"password123\",\"newPassword\":\"short\"}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
            .andExpect(jsonPath("$.errors[*].field").value("newPassword"));
    }

    @Test
    @DisplayName("PUT /api/users/me/password without authentication returns 401")
    void shouldRejectPasswordChangeWithoutAuthentication() throws Exception {
        mockMvc.perform(put("/api/users/me/password")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"currentPassword\":\"password123\",\"newPassword\":\"new-password-456\"}"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
    }

    private String bearer(UserDto user) {
        return "Bearer " + jwtService.createAccessToken(user.getId(), user.getEmail());
    }
}
