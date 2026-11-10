package com.gbatistadev.gymbro.bioimpedance.job;

import com.gbatistadev.gymbro.TestcontainersConfiguration;
import com.gbatistadev.gymbro.bioimpedance.parser.BioimpedanceParser;
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
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.fail;
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
@Import(TestcontainersConfiguration.class)
@DisplayName("Bioimpedance PDF import flow")
class BioimpedanceImportFlowIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserService userService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private BioimpedanceImportJobRepository jobRepository;

    @Autowired
    private BioimpedanceImportJobReaper reaper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @MockitoBean
    private BioimpedanceParser parser;

    @Test
    @DisplayName("upload, poll, confirm and deduplicate by file hash")
    void shouldRunUploadFlow() throws Exception {
        String owner = bearer(createUser());
        JsonNode extraction = extraction();
        when(parser.extract(any(byte[].class), anyString())).thenReturn(extraction);

        MockMultipartFile file = pdfFile();

        MvcResult upload = mockMvc.perform(multipart("/api/bioimpedance/imports")
                .file(file)
                .header(HttpHeaders.AUTHORIZATION, owner))
            .andExpect(status().isAccepted())
            .andReturn();
        String jobId = JsonPath.read(upload.getResponse().getContentAsString(), "$.id");

        awaitStatus(jobId, owner, "DONE");

        mockMvc.perform(get("/api/bioimpedance/imports/{id}", jobId).header(HttpHeaders.AUTHORIZATION, owner))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("DONE"))
            .andExpect(jsonPath("$.result.bodyFatPercentage").value(18.2))
            .andExpect(jsonPath("$.result.missingFields[0]").value("skeletalMuscleMassKg"))
            .andExpect(jsonPath("$.sourceFileHash").exists());

        String confirmation = """
            {"measuredAt":"2026-10-01T08:00:00Z","bodyFatPercentage":18.2,"muscleMassKg":38.1,
             "bodyWeightKg":82.4,"heightCm":178.0,"visceralFat":8.0,"waterPercentage":55.3,
             "skeletalMuscleMassKg":null}
            """;

        mockMvc.perform(post("/api/bioimpedance/imports/{id}/confirm", jobId)
                .header(HttpHeaders.AUTHORIZATION, owner)
                .contentType(MediaType.APPLICATION_JSON)
                .content(confirmation))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.bodyFatPercentage").value(18.2))
            .andExpect(jsonPath("$.source").value("IMPORT"))
            .andExpect(jsonPath("$.sourceFileHash").exists());

        // the same job cannot create a second measurement (same file hash)
        mockMvc.perform(post("/api/bioimpedance/imports/{id}/confirm", jobId)
                .header(HttpHeaders.AUTHORIZATION, owner)
                .contentType(MediaType.APPLICATION_JSON)
                .content(confirmation))
            .andExpect(status().isConflict());

        mockMvc.perform(get("/api/bioimpedance").header(HttpHeaders.AUTHORIZATION, owner))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(1));

        // same file: returns the existing job and does not call the parser again
        mockMvc.perform(multipart("/api/bioimpedance/imports")
                .file(pdfFile())
                .header(HttpHeaders.AUTHORIZATION, owner))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(jobId));

        verify(parser, times(1)).extract(any(byte[].class), anyString());
    }

    @Test
    @DisplayName("a non-PDF upload is rejected")
    void shouldRejectNonPdf() throws Exception {
        String auth = bearer(createUser());
        MockMultipartFile file = new MockMultipartFile(
            "file", "report.txt", "text/plain",
            "not a pdf".getBytes(StandardCharsets.UTF_8));

        mockMvc.perform(multipart("/api/bioimpedance/imports").file(file).header(HttpHeaders.AUTHORIZATION, auth))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("a parser failure marks the job FAILED")
    void shouldMarkJobFailed() throws Exception {
        String auth = bearer(createUser());
        when(parser.extract(any(byte[].class), anyString()))
            .thenThrow(new IllegalStateException("parser down"));

        MvcResult upload = mockMvc.perform(multipart("/api/bioimpedance/imports")
                .file(pdfFile())
                .header(HttpHeaders.AUTHORIZATION, auth))
            .andExpect(status().isAccepted())
            .andReturn();
        String jobId = JsonPath.read(upload.getResponse().getContentAsString(), "$.id");

        awaitStatus(jobId, auth, "FAILED");

        mockMvc.perform(get("/api/bioimpedance/imports/{id}", jobId).header(HttpHeaders.AUTHORIZATION, auth))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("FAILED"))
            .andExpect(jsonPath("$.error").value("parser down"));
    }

    @Test
    @DisplayName("import jobs are scoped to the authenticated user")
    void shouldIsolateJobsBetweenUsers() throws Exception {
        String owner = bearer(createUser());
        String other = bearer(createUser());
        when(parser.extract(any(byte[].class), anyString())).thenReturn(extraction());

        MvcResult upload = mockMvc.perform(multipart("/api/bioimpedance/imports")
                .file(pdfFile())
                .header(HttpHeaders.AUTHORIZATION, owner))
            .andExpect(status().isAccepted())
            .andReturn();
        String jobId = JsonPath.read(upload.getResponse().getContentAsString(), "$.id");

        mockMvc.perform(get("/api/bioimpedance/imports/{id}", jobId).header(HttpHeaders.AUTHORIZATION, other))
            .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("the reaper fails jobs stuck in PROCESSING")
    void shouldReapStaleProcessingJobs() {
        UserDto user = createUser();
        BioimpedanceImportJob job = new BioimpedanceImportJob();
        job.setUserId(user.getId());
        job.setStatus(ImportJobStatus.PROCESSING);
        job.setSourceFileName("stale.pdf");
        job.setSourceFileHash(UUID.randomUUID().toString().replace("-", ""));
        jobRepository.save(job);

        jdbcTemplate.update(
            "UPDATE bioimpedance_import_job SET updated_at = ? WHERE id = ?",
            Timestamp.from(Instant.now().minus(10, ChronoUnit.MINUTES)),
            job.getId());

        reaper.reap();

        BioimpedanceImportJob reloaded = jobRepository.findById(job.getId()).orElseThrow();
        assertEquals(ImportJobStatus.FAILED, reloaded.getStatus());
        assertEquals("processing interrupted", reloaded.getError());
    }

    private void awaitStatus(String jobId, String auth, String expected) throws Exception {
        long deadline = System.currentTimeMillis() + 5_000;
        while (System.currentTimeMillis() < deadline) {
            MvcResult result = mockMvc.perform(
                    get("/api/bioimpedance/imports/{id}", jobId).header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(status().isOk())
                .andReturn();
            String status = JsonPath.read(result.getResponse().getContentAsString(), "$.status");
            if (expected.equals(status)) {
                return;
            }
            Thread.sleep(50);
        }
        fail("job " + jobId + " did not reach " + expected);
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

    private String bearer(UserDto user) {
        return "Bearer " + jwtService.createAccessToken(user.getId(), user.getEmail());
    }

    private UserDto createUser() {
        return userService.create(new CreateUserDto(
            "User",
            "user-" + UUID.randomUUID() + "@example.com",
            "password123"
        ));
    }
}
