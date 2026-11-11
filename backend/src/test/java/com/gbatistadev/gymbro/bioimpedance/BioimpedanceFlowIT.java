package com.gbatistadev.gymbro.bioimpedance;

import com.gbatistadev.gymbro.TestcontainersConfiguration;
import com.gbatistadev.gymbro.config.jwt.JwtService;
import com.gbatistadev.gymbro.user.UserService;
import com.gbatistadev.gymbro.user.dto.CreateUserDto;
import com.gbatistadev.gymbro.user.dto.UserDto;
import com.jayway.jsonpath.JsonPath;
import org.springframework.http.HttpHeaders;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
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
@DisplayName("Bioimpedance ingestion flow")
class BioimpedanceFlowIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserService userService;

    @Autowired
    private JwtService jwtService;

    @Test
    @DisplayName("create, import, update, audit, soft delete and ownership")
    void shouldRunBioimpedanceLifecycle() throws Exception {
        String owner = bearer(createUser());
        String other = bearer(createUser());

        String createdId = createMeasurement(owner, "2026-10-01T08:00:00Z", 18.5);

        mockMvc.perform(get("/api/bioimpedance").header(HttpHeaders.AUTHORIZATION, owner))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(1))
            .andExpect(jsonPath("$[0].id").value(createdId))
            .andExpect(jsonPath("$[0].source").value("MANUAL"));

        String importBody = """
            {"items":[
              {"measuredAt":"2026-10-02T08:00:00Z","bodyFatPercentage":18.0,
               "muscleMassKg":38.2,"sourceFileHash":"hash-1","source":"IMPORT_CSV"},
              {"measuredAt":"2026-10-03T08:00:00Z","bodyFatPercentage":18.0,
               "muscleMassKg":38.3,"sourceFileHash":"hash-1"},
              {"measuredAt":"2026-10-02T08:00:00Z","bodyFatPercentage":18.0,
               "muscleMassKg":38.4},
              {"measuredAt":"2026-10-04T08:00:00Z","bodyFatPercentage":90.0,
               "muscleMassKg":38.5}
            ]}
            """;

        mockMvc.perform(post("/api/bioimpedance/import")
                .header(HttpHeaders.AUTHORIZATION, owner)
                .contentType(MediaType.APPLICATION_JSON)
                .content(importBody))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.created").value(1))
            .andExpect(jsonPath("$.duplicates").value(2))
            .andExpect(jsonPath("$.errors").value(1))
            .andExpect(jsonPath("$.results[0].status").value("CREATED"))
            .andExpect(jsonPath("$.results[1].status").value("DUPLICATE"))
            .andExpect(jsonPath("$.results[2].status").value("DUPLICATE"))
            .andExpect(jsonPath("$.results[3].status").value("ERROR"));

        mockMvc.perform(get("/api/bioimpedance").header(HttpHeaders.AUTHORIZATION, owner))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(2));

        mockMvc.perform(patch("/api/bioimpedance/{id}", createdId)
                .header(HttpHeaders.AUTHORIZATION, owner)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"bodyWeightKg\":80.0}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.bodyWeightKg").value(80.0))
            .andExpect(jsonPath("$.bodyFatPercentage").value(18.5));

        mockMvc.perform(get("/api/bioimpedance/{id}/history", createdId).header(HttpHeaders.AUTHORIZATION, owner))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(2))
            .andExpect(jsonPath("$[0].actionType").value("UPDATE"))
            .andExpect(jsonPath("$[0].oldData").exists())
            .andExpect(jsonPath("$[0].newData").exists())
            .andExpect(jsonPath("$[1].actionType").value("INSERT"));

        mockMvc.perform(delete("/api/bioimpedance/{id}", createdId).header(HttpHeaders.AUTHORIZATION, owner))
            .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/bioimpedance").header(HttpHeaders.AUTHORIZATION, owner))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(1));

        mockMvc.perform(get("/api/bioimpedance/{id}/history", createdId).header(HttpHeaders.AUTHORIZATION, owner))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(3))
            .andExpect(jsonPath("$[0].actionType").value("DELETE"));

        // the soft-deleted timestamp frees the unique slot
        createMeasurement(owner, "2026-10-01T08:00:00Z", 18.5);

        mockMvc.perform(get("/api/bioimpedance").header(HttpHeaders.AUTHORIZATION, other))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(0));

        mockMvc.perform(patch("/api/bioimpedance/{id}", createdId)
                .header(HttpHeaders.AUTHORIZATION, other)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"bodyWeightKg\":77.0}"))
            .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/bioimpedance/{id}/history", createdId).header(HttpHeaders.AUTHORIZATION, other))
            .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("creating the same timestamp twice returns 409")
    void shouldRejectDuplicateTimestamp() throws Exception {
        String auth = bearer(createUser());
        createMeasurement(auth, "2026-09-01T08:00:00Z", 20.0);

        mockMvc.perform(post("/api/bioimpedance")
                .header(HttpHeaders.AUTHORIZATION, auth)
                .contentType(MediaType.APPLICATION_JSON)
                .content(measurementBody("2026-09-01T08:00:00Z", 20.0)))
            .andExpect(status().isConflict());
    }

    private String createMeasurement(String auth, String measuredAt, double bodyFat)
        throws Exception {
        MvcResult result = mockMvc.perform(post("/api/bioimpedance")
                .header(HttpHeaders.AUTHORIZATION, auth)
                .contentType(MediaType.APPLICATION_JSON)
                .content(measurementBody(measuredAt, bodyFat)))
            .andExpect(status().isCreated())
            .andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.id");
    }

    private String measurementBody(String measuredAt, double bodyFat) {
        return """
            {"measuredAt":"%s","bodyFatPercentage":%s,"muscleMassKg":38.0,
             "visceralFat":8.0,"waterPercentage":55.0,"bodyWeightKg":82.4,"heightCm":178.0}
            """.formatted(measuredAt, bodyFat);
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
