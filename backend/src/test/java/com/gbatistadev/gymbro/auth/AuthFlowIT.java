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
import org.springframework.mock.web.MockHttpServletResponse;
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
    @DisplayName("register → login → 401 sem cookie → refresh → retry → 200")
    void fullAuthFlow() throws Exception {
        String email = "flow-" + UUID.randomUUID() + "@example.com";
        MvcResult login = registerAndLogin(email);
        String access = cookie(login, "access_token");
        String refresh = cookie(login, "refresh_token");

        // access cookie válido → dados resumidos
        mockMvc.perform(get("/api/users/me").cookie(new Cookie("access_token", access)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value(email))
            .andExpect(jsonPath("$.name").value("Flow User"))
            .andExpect(jsonPath("$.createdAt").exists())
            .andExpect(jsonPath("$.passwordHash").doesNotExist());

        // sem access cookie → 401 no shape padrão
        mockMvc.perform(get("/api/users/me"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.status").value(401))
            .andExpect(jsonPath("$.error").value("UNAUTHORIZED"))
            .andExpect(jsonPath("$.path").value("/api/users/me"));

        // refresh com o refresh cookie → novo access cookie
        MvcResult refreshed = mockMvc.perform(post("/api/auth/refresh")
                .cookie(new Cookie("refresh_token", refresh)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value(email))
            .andReturn();
        String newAccess = cookie(refreshed, "access_token");

        // retry da requisição original com o access novo → 200
        mockMvc.perform(get("/api/users/me").cookie(new Cookie("access_token", newAccess)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value(email));
    }

    @Test
    @DisplayName("refresh com expires_at no passado → 401 ErrorResponse")
    void expiredRefreshIsRejected() throws Exception {
        String email = "expired-" + UUID.randomUUID() + "@example.com";
        MvcResult login = registerAndLogin(email);
        String refresh = cookie(login, "refresh_token");

        String userId = JsonPath.read(login.getResponse().getContentAsString(), "$.id");
        RefreshToken stored = refreshTokenRepository.findByUserId(UUID.fromString(userId)).orElseThrow();
        stored.setExpiresAt(Instant.now().minusSeconds(60));
        refreshTokenRepository.save(stored);

        mockMvc.perform(post("/api/auth/refresh").cookie(new Cookie("refresh_token", refresh)))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.status").value(401))
            .andExpect(jsonPath("$.error").value("UNAUTHORIZED"))
            .andExpect(jsonPath("$.message").value("Invalid refresh token"))
            .andExpect(jsonPath("$.path").value("/api/auth/refresh"));
    }

    private MvcResult registerAndLogin(String email) throws Exception {
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name":"Flow User","email":"%s","password":"password123"}
                    """.formatted(email)))
            .andExpect(status().isCreated());

        return mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"%s","password":"password123"}
                    """.formatted(email)))
            .andExpect(status().isOk())
            .andReturn();
    }

    private String cookie(MvcResult result, String name) {
        MockHttpServletResponse response = result.getResponse();
        return response.getHeaders("Set-Cookie").stream()
            .filter(header -> header.startsWith(name + "="))
            .map(header -> header.substring(name.length() + 1, header.indexOf(';')))
            .findFirst()
            .orElseThrow(() -> new AssertionError("cookie ausente na resposta: " + name));
    }
}
