package com.gbatistadev.gymbro.config.security;

import com.gbatistadev.gymbro.TestcontainersConfiguration;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
@DisplayName("CORS for the Expo web target")
class CorsConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("preflight from the allowed origin is answered without authentication")
    void shouldAnswerPreflight() throws Exception {
        mockMvc.perform(options("/api/playlists")
                .header("Origin", "http://localhost:8081")
                .header("Access-Control-Request-Method", "GET")
                .header("Access-Control-Request-Headers", "authorization"))
            .andExpect(status().isOk())
            .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:8081"))
            .andExpect(header().exists("Access-Control-Allow-Methods"));
    }

    @Test
    @DisplayName("preflight from an unknown origin is rejected")
    void shouldRejectUnknownOrigin() throws Exception {
        mockMvc.perform(options("/api/playlists")
                .header("Origin", "https://evil.example")
                .header("Access-Control-Request-Method", "GET"))
            .andExpect(status().isForbidden());
    }
}
