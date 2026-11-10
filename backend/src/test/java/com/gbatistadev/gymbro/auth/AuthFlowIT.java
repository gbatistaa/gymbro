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

import java.time.Instant;
import java.util.UUID;

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
            .andExpect(jsonPath("$.error").value("UNAUTHORIZED"))
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
            .findByUserId(UUID.fromString(login.userId()))
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
            .andExpect(jsonPath("$.error").value("UNAUTHORIZED"))
            .andExpect(jsonPath("$.message").value("Invalid refresh token"))
            .andExpect(jsonPath("$.path").value("/api/auth/refresh"));
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

        MvcResult login = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"%s","password":"password123"}
                    """.formatted(email)))
            .andExpect(status().isOk())
            .andReturn();

        String body = login.getResponse().getContentAsString();
        return new Login(
            userId,
            JsonPath.read(body, "$.accessToken"),
            JsonPath.read(body, "$.refreshToken"));
    }

    private record Login(String userId, String accessToken, String refreshToken) {}
}
