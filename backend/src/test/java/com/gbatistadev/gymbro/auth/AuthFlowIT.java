package com.gbatistadev.gymbro.auth;

import com.gbatistadev.gymbro.TestcontainersConfiguration;
import com.gbatistadev.gymbro.user.RefreshToken;
import com.gbatistadev.gymbro.user.RefreshTokenRepository;
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
import org.springframework.test.web.servlet.ResultActions;

import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
@DisplayName("AuthFlow integration test")
class AuthFlowIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Test
    @DisplayName("register → login with body tokens → 401 without header → refresh → retry → 200")
    void fullAuthFlow() throws Exception {
        String email = "flow-" + UUID.randomUUID() + "@example.com";
        Login login = registerAndLogin(email);

        // bearer válido → dados resumidos
        mockMvc.perform(get("/api/users/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + login.accessToken()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value(email))
            .andExpect(jsonPath("$.name").value("Flow User"))
            .andExpect(jsonPath("$.createdAt").exists())
            .andExpect(jsonPath("$.passwordHash").doesNotExist());

        // sem header → 401 no shape padrão
        mockMvc.perform(get("/api/users/me"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.status").value(401))
            .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"))
            .andExpect(jsonPath("$.path").value("/api/users/me"));

        // refresh pelo corpo → novo access token
        MvcResult refreshed = mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"refreshToken":"%s"}
                    """.formatted(login.refreshToken())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.tokenType").value("Bearer"))
            .andExpect(jsonPath("$.refreshToken").value(login.refreshToken()))
            .andReturn();
        String newAccess = JsonPath.read(refreshed.getResponse().getContentAsString(), "$.accessToken");

        // retry da requisição original com o access novo → 200
        mockMvc.perform(get("/api/users/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + newAccess))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value(email));
    }

    @Test
    @DisplayName("refresh with expires_at in the past → 401 ErrorResponse")
    void expiredRefreshIsRejected() throws Exception {
        String email = "expired-" + UUID.randomUUID() + "@example.com";
        Login login = registerAndLogin(email);

        RefreshToken stored = refreshTokenRepository
            .findAllByUserId(UUID.fromString(login.userId()))
            .stream()
            .findFirst()
            .orElseThrow();
        stored.setExpiresAt(Instant.now().minusSeconds(60));
        refreshTokenRepository.save(stored);

        mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"refreshToken":"%s"}
                    """.formatted(login.refreshToken())))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.status").value(401))
            .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"))
            .andExpect(jsonPath("$.message").value("Invalid refresh token"))
            .andExpect(jsonPath("$.path").value("/api/auth/refresh"));
    }

    @Test
    @DisplayName("logout revokes the refresh token, which can no longer be exchanged")
    void logoutRevokesRefreshToken() throws Exception {
        String email = "logout-" + UUID.randomUUID() + "@example.com";
        Login login = registerAndLogin(email);

        mockMvc.perform(post("/api/auth/logout")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"refreshToken":"%s"}
                    """.formatted(login.refreshToken())))
            .andExpect(status().isNoContent());

        mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"refreshToken":"%s"}
                    """.formatted(login.refreshToken())))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.message").value("Invalid refresh token"));
    }

    @Test
    @DisplayName("the access token stays valid after logout until it expires (stateless JWT)")
    void logoutDoesNotRevokeTheAccessToken() throws Exception {
        String email = "logout-access-" + UUID.randomUUID() + "@example.com";
        Login login = registerAndLogin(email);

        mockMvc.perform(post("/api/auth/logout")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"refreshToken":"%s"}
                    """.formatted(login.refreshToken())))
            .andExpect(status().isNoContent());

        // documenta o limite real do stateless: sem lista de revogação, o access vale até expirar
        mockMvc.perform(get("/api/users/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + login.accessToken()))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("logout without a refresh token revokes every session of the authenticated user")
    void logoutWithoutTokenRevokesAllSessions() throws Exception {
        String email = "logout-all-" + UUID.randomUUID() + "@example.com";
        Login login = registerAndLogin(email);

        mockMvc.perform(post("/api/auth/logout")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + login.accessToken()))
            .andExpect(status().isNoContent());

        mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"refreshToken":"%s"}
                    """.formatted(login.refreshToken())))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("logout without a refresh token and without authentication returns 401")
    void logoutWithoutTokenRequiresAuthentication() throws Exception {
        mockMvc.perform(post("/api/auth/logout"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.status").value(401))
            .andExpect(jsonPath("$.message").value("Authentication required"));
    }

    @Test
    @DisplayName("logout is idempotent: revoking an already revoked token still returns 204")
    void logoutIsIdempotent() throws Exception {
        String email = "logout-twice-" + UUID.randomUUID() + "@example.com";
        Login login = registerAndLogin(email);
        String body = """
            {"refreshToken":"%s"}
            """.formatted(login.refreshToken());

        mockMvc.perform(post("/api/auth/logout").contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isNoContent());
        mockMvc.perform(post("/api/auth/logout").contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("two logins keep independent sessions: revoking one leaves the other usable")
    void devicesKeepIndependentSessions() throws Exception {
        String email = "devices-" + UUID.randomUUID() + "@example.com";
        Login mobile = registerAndLogin(email);
        Tokens web = login(email);

        // o segundo login não derruba o primeiro
        refresh(mobile.refreshToken()).andExpect(status().isOk());
        refresh(web.refreshToken()).andExpect(status().isOk());

        // encerrar o mobile não afeta o web
        mockMvc.perform(post("/api/auth/logout")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"refreshToken":"%s"}
                    """.formatted(mobile.refreshToken())))
            .andExpect(status().isNoContent());

        refresh(mobile.refreshToken()).andExpect(status().isUnauthorized());
        refresh(web.refreshToken()).andExpect(status().isOk());
    }

    @Test
    @DisplayName("an expired session row is pruned on the next login")
    void expiredSessionsArePrunedOnLogin() throws Exception {
        String email = "prune-" + UUID.randomUUID() + "@example.com";
        Login first = registerAndLogin(email);

        RefreshToken expired = refreshTokenRepository
            .findAllByUserId(UUID.fromString(first.userId()))
            .stream()
            .findFirst()
            .orElseThrow();
        expired.setExpiresAt(Instant.now().minusSeconds(60));
        refreshTokenRepository.save(expired);

        login(email);

        assertEquals(1, refreshTokenRepository.findAllByUserId(UUID.fromString(first.userId())).size(),
            "a sessão expirada deve ser removida no login, não acumular");
    }

    private ResultActions refresh(String refreshToken) throws Exception {
        return mockMvc.perform(post("/api/auth/refresh")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"refreshToken":"%s"}
                """.formatted(refreshToken)));
    }

    private Login registerAndLogin(String email) throws Exception {
        MvcResult registered = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name":"Flow User","email":"%s","password":"password123"}
                    """.formatted(email)))
            .andExpect(status().isCreated())
            .andReturn();
        String userId = JsonPath.read(registered.getResponse().getContentAsString(), "$.id");

        Tokens tokens = login(email);
        return new Login(userId, tokens.accessToken(), tokens.refreshToken());
    }

    private Tokens login(String email) throws Exception {
        MvcResult login = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"%s","password":"password123"}
                    """.formatted(email)))
            .andExpect(status().isOk())
            .andReturn();

        String body = login.getResponse().getContentAsString();
        return new Tokens(
            JsonPath.read(body, "$.accessToken"),
            JsonPath.read(body, "$.refreshToken"));
    }

    private record Tokens(String accessToken, String refreshToken) {}

    private record Login(String userId, String accessToken, String refreshToken) {}
}
