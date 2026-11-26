package com.gbatistadev.gymbro.user;

import com.gbatistadev.gymbro.TestcontainersConfiguration;
import com.gbatistadev.gymbro.config.jwt.JwtService;
import com.gbatistadev.gymbro.user.dto.CreateUserDto;
import com.gbatistadev.gymbro.user.dto.UserDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
@DisplayName("Profile update flow")
class UserProfileUpdateIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserService userService;

    @Autowired
    private JwtService jwtService;

    @Test
    @DisplayName("updates name and timezone and returns the stored profile")
    void shouldUpdateProfileFields() throws Exception {
        UserDto user = createUser();

        mockMvc.perform(put("/api/users/me")
                .header(HttpHeaders.AUTHORIZATION, bearer(user))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name":"Nome Novo","timezone":"America/Manaus"}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Nome Novo"))
            .andExpect(jsonPath("$.timezone").value("America/Manaus"));
    }

    @Test
    @DisplayName("rejects an email already used by another account, pointing at the email field")
    void shouldRejectEmailAlreadyInUse() throws Exception {
        UserDto taken = createUser();
        UserDto user = createUser();

        mockMvc.perform(put("/api/users/me")
                .header(HttpHeaders.AUTHORIZATION, bearer(user))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"%s"}
                    """.formatted(taken.getEmail())))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value("RESOURCE_ALREADY_EXISTS"))
            .andExpect(jsonPath("$.errors[0].field").value("email"));
    }

    @Test
    @DisplayName("keeps the current email when the same address is sent back")
    void shouldAcceptOwnEmail() throws Exception {
        UserDto user = createUser();

        mockMvc.perform(put("/api/users/me")
                .header(HttpHeaders.AUTHORIZATION, bearer(user))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"%s"}
                    """.formatted(user.getEmail())))
            .andExpect(status().isOk());
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
}
