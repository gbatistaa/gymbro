package com.gbatistadev.gymbro.auth;

import com.gbatistadev.gymbro.TestcontainersConfiguration;
import com.gbatistadev.gymbro.user.RefreshToken;
import com.gbatistadev.gymbro.user.RefreshTokenRepository;
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
    @DisplayName("register sets cookies → 200 with cookie → 401 without cookie → refresh → 200")
    void fullAuthFlow() throws Exception {
        String email = "flow-" + UUID.randomUUID() + "@example.com";
        Session session = register(email);

        mockMvc.perform(get("/api/users/me").cookie(accessCookie(session)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value(email))
            .andExpect(jsonPath("$.name").value("Flow User"))
            .andExpect(jsonPath("$.createdAt").exists())
            .andExpect(jsonPath("$.passwordHash").doesNotExist());

        mockMvc.perform(get("/api/users/me"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.status").value(401))
            .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"))
            .andExpect(jsonPath("$.path").value("/api/users/me"));

        MvcResult refreshed = mockMvc.perform(post("/api/auth/refresh")
                .cookie(new Cookie(AuthCookies.REFRESH, session.refreshToken())))
            .andExpect(status().isNoContent())
            .andReturn();

        mockMvc.perform(get("/api/users/me")
                .cookie(new Cookie(AuthCookies.ACCESS, cookieValue(refreshed, AuthCookies.ACCESS))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value(email));
    }

    @Test
    @DisplayName("refresh with expires_at in the past → 401 ErrorResponse")
    void expiredRefreshIsRejected() throws Exception {
        String email = "expired-" + UUID.randomUUID() + "@example.com";
        Session session = register(email);

        RefreshToken stored = refreshTokenRepository
            .findAllByUserId(UUID.fromString(session.userId()))
            .stream()
            .findFirst()
            .orElseThrow();
        stored.setExpiresAt(Instant.now().minusSeconds(60));
        refreshTokenRepository.save(stored);

        refresh(session.refreshToken())
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.status").value(401))
            .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"))
            .andExpect(jsonPath("$.message").value("Invalid refresh token"))
            .andExpect(jsonPath("$.path").value("/api/auth/refresh"));
    }

    @Test
    @DisplayName("logout revokes the refresh cookie, which can no longer be exchanged")
    void logoutRevokesRefreshToken() throws Exception {
        String email = "logout-" + UUID.randomUUID() + "@example.com";
        Session session = register(email);

        mockMvc.perform(post("/api/auth/logout")
                .cookie(new Cookie(AuthCookies.REFRESH, session.refreshToken())))
            .andExpect(status().isNoContent());

        refresh(session.refreshToken())
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.message").value("Invalid refresh token"));
    }

    @Test
    @DisplayName("the access cookie stays valid after logout until it expires (stateless JWT)")
    void logoutDoesNotRevokeTheAccessToken() throws Exception {
        String email = "logout-access-" + UUID.randomUUID() + "@example.com";
        Session session = register(email);

        mockMvc.perform(post("/api/auth/logout")
                .cookie(new Cookie(AuthCookies.REFRESH, session.refreshToken())))
            .andExpect(status().isNoContent());

        // documenta o limite real do stateless: sem lista de revogação, o access vale até expirar
        mockMvc.perform(get("/api/users/me").cookie(accessCookie(session)))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("logout with only the access cookie revokes every session of the user")
    void logoutWithoutTokenRevokesAllSessions() throws Exception {
        String email = "logout-all-" + UUID.randomUUID() + "@example.com";
        Session session = register(email);

        mockMvc.perform(post("/api/auth/logout").cookie(accessCookie(session)))
            .andExpect(status().isNoContent());

        refresh(session.refreshToken())
            .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("logout without cookies returns 401")
    void logoutWithoutTokenRequiresAuthentication() throws Exception {
        mockMvc.perform(post("/api/auth/logout"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.status").value(401))
            .andExpect(jsonPath("$.message").value("Authentication required"));
    }

    @Test
    @DisplayName("logout is idempotent: revoking an already revoked cookie still returns 204")
    void logoutIsIdempotent() throws Exception {
        String email = "logout-twice-" + UUID.randomUUID() + "@example.com";
        Session session = register(email);
        Cookie refreshCookie = new Cookie(AuthCookies.REFRESH, session.refreshToken());

        mockMvc.perform(post("/api/auth/logout").cookie(refreshCookie))
            .andExpect(status().isNoContent());
        mockMvc.perform(post("/api/auth/logout").cookie(refreshCookie))
            .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("two logins keep independent sessions: revoking one leaves the other usable")
    void devicesKeepIndependentSessions() throws Exception {
        String email = "devices-" + UUID.randomUUID() + "@example.com";
        Session first = register(email);
        Session second = login(email);

        refresh(first.refreshToken()).andExpect(status().isNoContent());
        refresh(second.refreshToken()).andExpect(status().isNoContent());

        mockMvc.perform(post("/api/auth/logout")
                .cookie(new Cookie(AuthCookies.REFRESH, first.refreshToken())))
            .andExpect(status().isNoContent());

        refresh(first.refreshToken()).andExpect(status().isUnauthorized());
        refresh(second.refreshToken()).andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("an expired session row is pruned on the next login")
    void expiredSessionsArePrunedOnLogin() throws Exception {
        String email = "prune-" + UUID.randomUUID() + "@example.com";
        Session first = register(email);

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
            .cookie(new Cookie(AuthCookies.REFRESH, refreshToken)));
    }

    private Session register(String email) throws Exception {
        MvcResult registered = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name":"Flow User","email":"%s","password":"password123"}
                    """.formatted(email)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.createdAt").exists())
            .andReturn();

        return sessionFrom(registered);
    }

    private Session login(String email) throws Exception {
        MvcResult login = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"%s","password":"password123"}
                    """.formatted(email)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.createdAt").exists())
            .andReturn();

        return sessionFrom(login);
    }

    private Session sessionFrom(MvcResult result) throws Exception {
        String userId = JsonPath.read(result.getResponse().getContentAsString(), "$.id");
        return new Session(
            userId,
            cookieValue(result, AuthCookies.ACCESS),
            cookieValue(result, AuthCookies.REFRESH));
    }

    private Cookie accessCookie(Session session) {
        return new Cookie(AuthCookies.ACCESS, session.accessToken());
    }

    private String cookieValue(MvcResult result, String name) {
        String header = result.getResponse().getHeaders("Set-Cookie").stream()
            .filter(value -> value.startsWith(name + "="))
            .findFirst()
            .orElseThrow(() -> new AssertionError("cookie ausente: " + name));
        int separator = header.indexOf(';');
        int end = separator < 0 ? header.length() : separator;
        return header.substring((name + "=").length(), end);
    }

    private record Session(String userId, String accessToken, String refreshToken) {}
}
