package com.gbatistadev.gymbro.bioimpedance.job;

import com.gbatistadev.gymbro.TestcontainersConfiguration;
import com.gbatistadev.gymbro.bioimpedance.parser.BioimpedanceParser;
import com.gbatistadev.gymbro.config.jwt.JwtService;
import com.gbatistadev.gymbro.user.UserService;
import com.gbatistadev.gymbro.user.dto.CreateUserDto;
import com.gbatistadev.gymbro.user.dto.UserDto;
import com.jayway.jsonpath.JsonPath;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.core.task.SyncTaskExecutor;
import org.springframework.core.task.TaskExecutor;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, BioimpedanceImportFlowIT.SyncAsyncConfig.class})
@DisplayName("Bioimpedance PDF import flow")
class BioimpedanceImportFlowIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserService userService;

    @Autowired
    private JwtService jwtService;

    @MockitoBean
    private BioimpedanceParser parser;

    @TestConfiguration(proxyBeanMethods = false)
    static class SyncAsyncConfig {
        @Bean(name = "applicationTaskExecutor")
        TaskExecutor applicationTaskExecutor() {
            return new SyncTaskExecutor();
        }
    }

    @Test
    @DisplayName("upload, poll, confirm and deduplicate by file hash")
    void shouldRunUploadFlow() throws Exception {
        Cookie owner = accessCookie(createUser());
        JsonNode extraction = extraction();
        when(parser.extract(any(byte[].class), anyString())).thenReturn(extraction);

        MockMultipartFile file = pdfFile();

        MvcResult upload = mockMvc.perform(multipart("/api/bioimpedance/imports")
                .file(file)
                .cookie(owner))
            .andExpect(status().isAccepted())
            .andExpect(jsonPath("$.status").value("DONE"))
            .andExpect(jsonPath("$.result.bodyFatPercentage").value(18.2))
            .andExpect(jsonPath("$.result.missingFields[0]").value("skeletalMuscleMassKg"))
            .andReturn();
        String jobId = JsonPath.read(upload.getResponse().getContentAsString(), "$.id");

        mockMvc.perform(get("/api/bioimpedance/imports/{id}", jobId).cookie(owner))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("DONE"))
            .andExpect(jsonPath("$.sourceFileHash").exists());

        // the preview can be confirmed through the existing import contract
        mockMvc.perform(post("/api/bioimpedance/import")
                .cookie(owner)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"items\":[" + extraction + "]}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.created").value(1))
            .andExpect(jsonPath("$.duplicates").value(0))
            .andExpect(jsonPath("$.errors").value(0));

        mockMvc.perform(get("/api/bioimpedance").cookie(owner))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(1));

        // same file: returns the existing job and does not call the parser again
        mockMvc.perform(multipart("/api/bioimpedance/imports")
                .file(pdfFile())
                .cookie(owner))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(jobId));

        verify(parser, times(1)).extract(any(byte[].class), anyString());
    }

    @Test
    @DisplayName("a non-PDF upload is rejected")
    void shouldRejectNonPdf() throws Exception {
        Cookie cookie = accessCookie(createUser());
        MockMultipartFile file = new MockMultipartFile(
            "file", "report.txt", "text/plain",
            "not a pdf".getBytes(StandardCharsets.UTF_8));

        mockMvc.perform(multipart("/api/bioimpedance/imports").file(file).cookie(cookie))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("a parser failure marks the job FAILED")
    void shouldMarkJobFailed() throws Exception {
        Cookie cookie = accessCookie(createUser());
        when(parser.extract(any(byte[].class), anyString()))
            .thenThrow(new IllegalStateException("parser down"));

        MvcResult upload = mockMvc.perform(multipart("/api/bioimpedance/imports")
                .file(pdfFile())
                .cookie(cookie))
            .andExpect(status().isAccepted())
            .andExpect(jsonPath("$.status").value("FAILED"))
            .andExpect(jsonPath("$.error").value("parser down"))
            .andReturn();
        String jobId = JsonPath.read(upload.getResponse().getContentAsString(), "$.id");

        mockMvc.perform(get("/api/bioimpedance/imports/{id}", jobId).cookie(cookie))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("FAILED"));
    }

    @Test
    @DisplayName("import jobs are scoped to the authenticated user")
    void shouldIsolateJobsBetweenUsers() throws Exception {
        Cookie owner = accessCookie(createUser());
        Cookie other = accessCookie(createUser());
        when(parser.extract(any(byte[].class), anyString())).thenReturn(extraction());

        MvcResult upload = mockMvc.perform(multipart("/api/bioimpedance/imports")
                .file(pdfFile())
                .cookie(owner))
            .andExpect(status().isAccepted())
            .andReturn();
        String jobId = JsonPath.read(upload.getResponse().getContentAsString(), "$.id");

        mockMvc.perform(get("/api/bioimpedance/imports/{id}", jobId).cookie(other))
            .andExpect(status().isNotFound());
    }

    private JsonNode extraction() throws Exception {
        return JsonMapper.builder().build().readTree("""
            {
              "measuredAt": "2026-10-01T08:00:00Z",
              "bodyWeightKg": 82.4,
              "heightCm": 178.0,
              "bodyFatPercentage": 18.2,
              "muscleMassKg": 38.1,
              "skeletalMuscleMassKg": null,
              "visceralFat": 8.0,
              "waterPercentage": 55.3,
              "missingFields": ["skeletalMuscleMassKg"]
            }
            """);
    }

    private MockMultipartFile pdfFile() {
        return new MockMultipartFile(
            "file",
            "inbody.pdf",
            "application/pdf",
            "%PDF-1.4 fake content".getBytes(StandardCharsets.ISO_8859_1));
    }

    private Cookie accessCookie(UserDto user) {
        return new Cookie("access_token", jwtService.createAccessToken(user.getId(), user.getEmail()));
    }

    private UserDto createUser() {
        return userService.create(new CreateUserDto(
            "User",
            "user-" + UUID.randomUUID() + "@example.com",
            "password123"
        ));
    }
}
