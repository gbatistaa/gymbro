package com.gbatistadev.gymbro.analytics;

import com.gbatistadev.gymbro.TestcontainersConfiguration;
import com.gbatistadev.gymbro.bioimpedance.Bioimpedance;
import com.gbatistadev.gymbro.bioimpedance.BioimpedanceRepository;
import com.gbatistadev.gymbro.bioimpedance.BioimpedanceSamples;
import com.gbatistadev.gymbro.config.jwt.JwtService;
import com.gbatistadev.gymbro.user.UserService;
import com.gbatistadev.gymbro.user.dto.CreateUserDto;
import com.gbatistadev.gymbro.user.dto.UserDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
@DisplayName("Bioimpedance evolution dashboard")
class BioimpedanceEvolutionIT {

    private static final String FROM = "2026-01-01T00:00:00Z";
    private static final String TO = "2026-04-01T00:00:00Z";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserService userService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private BioimpedanceRepository bioimpedance;

    @Test
    @DisplayName("returns every metric of the user's live measurements inside the range")
    void shouldReturnEvolutionInsideRange() throws Exception {
        UserDto user = createUser();
        UserDto other = createUser();
        save(BioimpedanceSamples.completeMeasurement(user.getId(), Instant.parse("2026-01-15T09:00:00Z")));
        save(BioimpedanceSamples.measurement(user.getId(), Instant.parse("2026-03-15T09:00:00Z"), 80.0, 16.0));
        save(BioimpedanceSamples.measurement(user.getId(), Instant.parse("2025-12-31T23:59:00Z"), 90.0, 25.0));
        save(BioimpedanceSamples.measurement(user.getId(), Instant.parse("2026-04-01T00:00:01Z"), 70.0, 10.0));
        Bioimpedance deleted = BioimpedanceSamples.measurement(
            user.getId(), Instant.parse("2026-02-15T09:00:00Z"), 99.0, 30.0);
        deleted.setDeletedAt(Instant.parse("2026-02-16T09:00:00Z"));
        save(deleted);
        save(BioimpedanceSamples.measurement(other.getId(), Instant.parse("2026-02-01T09:00:00Z"), 60.0, 12.0));

        mockMvc.perform(get("/api/bioimpedance/evolution")
                .param("from", FROM)
                .param("to", TO)
                .header(HttpHeaders.AUTHORIZATION, bearer(user)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.measurementCount").value(2))
            .andExpect(jsonPath("$.metrics.length()").value(6))
            .andExpect(jsonPath("$.metrics[0].metric").value("bodyWeightKg"))
            .andExpect(jsonPath("$.metrics[0].points.length()").value(2))
            .andExpect(jsonPath("$.metrics[0].points[0].measuredAt").value("2026-01-15T09:00:00Z"))
            .andExpect(jsonPath("$.metrics[0].first").value(82.0))
            .andExpect(jsonPath("$.metrics[0].last").value(80.0))
            .andExpect(jsonPath("$.metrics[0].deltaAbsolute").value(-2.0))
            .andExpect(jsonPath("$.metrics[5].metric").value("waterPercentage"))
            .andExpect(jsonPath("$.metrics[5].points.length()").value(1))
            .andExpect(jsonPath("$.metrics[5].deltaAbsolute").doesNotExist());
    }

    @Test
    @DisplayName("rejects a range whose start is not before its end")
    void shouldRejectInvertedRange() throws Exception {
        mockMvc.perform(get("/api/bioimpedance/evolution")
                .param("from", TO)
                .param("to", FROM)
                .header(HttpHeaders.AUTHORIZATION, bearer(createUser())))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("INVALID_RANGE"));
    }

    @Test
    @DisplayName("requires both ends of the range")
    void shouldRequireRange() throws Exception {
        mockMvc.perform(get("/api/bioimpedance/evolution")
                .param("from", FROM)
                .header(HttpHeaders.AUTHORIZATION, bearer(createUser())))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("requires authentication")
    void shouldRequireAuthentication() throws Exception {
        mockMvc.perform(get("/api/bioimpedance/evolution").param("from", FROM).param("to", TO))
            .andExpect(status().isUnauthorized());
    }

    private void save(Bioimpedance measurement) {
        bioimpedance.save(measurement);
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
