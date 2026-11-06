package com.gbatistadev.gymbro.user;

import com.gbatistadev.gymbro.TestcontainersConfiguration;
import com.gbatistadev.gymbro.config.jwt.JwtService;
import com.gbatistadev.gymbro.user.dto.CreateUserDto;
import com.gbatistadev.gymbro.user.dto.UserDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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

    @Test
    @DisplayName("GET /api/users/me without access cookie returns standard 401")
    void shouldRejectRequestWithoutCookie() throws Exception {
        mockMvc.perform(get("/api/users/me"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.status").value(401))
            .andExpect(jsonPath("$.error").value("UNAUTHORIZED"))
            .andExpect(jsonPath("$.message").value("Authentication required"))
            .andExpect(jsonPath("$.path").value("/api/users/me"));
    }

    @Test
    @DisplayName("GET /api/users/me returns summary for valid access cookie")
    void shouldReturnCurrentUserSummary() throws Exception {
        String email = "user-" + UUID.randomUUID() + "@example.com";
        UserDto user = userService.create(new CreateUserDto("Test User", email, "password123"));
        String token = jwtService.createAccessToken(user.getId(), user.getEmail());

        mockMvc.perform(get("/api/users/me").cookie(new jakarta.servlet.http.Cookie("access_token", token)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(user.getId().toString()))
            .andExpect(jsonPath("$.name").value("Test User"))
            .andExpect(jsonPath("$.email").value(email))
            .andExpect(jsonPath("$.createdAt").exists())
            .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    @DisplayName("PUT /api/users/me updates only provided fields")
    void shouldUpdateCurrentUser() throws Exception {
        String email = "user-" + UUID.randomUUID() + "@example.com";
        UserDto user = userService.create(new CreateUserDto("Test User", email, "password123"));
        String token = jwtService.createAccessToken(user.getId(), user.getEmail());

        mockMvc.perform(put("/api/users/me")
                .cookie(new jakarta.servlet.http.Cookie("access_token", token))
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
        UserDto user = userService.create(new CreateUserDto("Test User", email, "password123"));
        String token = jwtService.createAccessToken(user.getId(), user.getEmail());
        String updatedEmail = "updated-" + UUID.randomUUID() + "@example.com";

        mockMvc.perform(put("/api/users/me")
                .cookie(new jakarta.servlet.http.Cookie("access_token", token))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + updatedEmail + "\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Test User"))
            .andExpect(jsonPath("$.email").value(updatedEmail));
    }

    @Test
    @DisplayName("invalid access cookie returns standard 401")
    void shouldRejectInvalidToken() throws Exception {
        mockMvc.perform(get("/api/users/me")
                .cookie(new jakarta.servlet.http.Cookie("access_token", "not-a-jwt")))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.status").value(401))
            .andExpect(jsonPath("$.path").value("/api/users/me"));
    }

    @Test
    @DisplayName("other API routes are protected too")
    void shouldProtectExerciseRoutes() throws Exception {
        mockMvc.perform(get("/api/exercises"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.status").value(401))
            .andExpect(jsonPath("$.path").value("/api/exercises"));
    }
}
