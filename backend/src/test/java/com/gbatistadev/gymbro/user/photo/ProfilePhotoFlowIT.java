package com.gbatistadev.gymbro.user.photo;

import com.gbatistadev.gymbro.TestcontainersConfiguration;
import com.gbatistadev.gymbro.common.storage.ObjectStorage;
import com.gbatistadev.gymbro.config.jwt.JwtService;
import com.gbatistadev.gymbro.user.UserService;
import com.gbatistadev.gymbro.user.dto.CreateUserDto;
import com.gbatistadev.gymbro.user.dto.UserDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.util.UUID;

import static org.hamcrest.Matchers.startsWith;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
@DisplayName("Profile photo flow")
class ProfilePhotoFlowIT {
    private static final String PHOTO_URL = "/api/users/me/photo";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserService userService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @MockitoBean
    private ObjectStorage storage;

    @BeforeEach
    void stubReadUrl() {
        when(storage.readUrl(anyString())).thenAnswer(call -> "https://storage.test/" + call.getArgument(0));
    }

    @Test
    @DisplayName("a user without a photo gets 204")
    void shouldReturnNoContentWithoutPhoto() throws Exception {
        UserDto user = createUser();

        mockMvc.perform(get(PHOTO_URL).header(HttpHeaders.AUTHORIZATION, bearer(user)))
            .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("the first upload creates the relation and stores the object with the detected type")
    void shouldCreatePhoto() throws Exception {
        UserDto user = createUser();

        upload(user, ProfilePhotoFormat.WEBP)
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.contentType").value("image/webp"))
            .andExpect(jsonPath("$.url").value(startsWith(
                "https://storage.test/profile-photos/" + user.getId() + "/")));

        String key = objectKeyOf(user);
        verify(storage).put(eq(key), any(byte[].class), eq("image/webp"));
        mockMvc.perform(get(PHOTO_URL).header(HttpHeaders.AUTHORIZATION, bearer(user)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.url").value("https://storage.test/" + key));
    }

    @Test
    @DisplayName("a second upload updates the same row and deletes the previous object")
    void shouldReplacePhoto() throws Exception {
        UserDto user = createUser();
        upload(user, ProfilePhotoFormat.PNG).andExpect(status().isOk());
        String firstKey = objectKeyOf(user);

        upload(user, ProfilePhotoFormat.GIF)
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.contentType").value("image/gif"));

        assertEquals(1, photoRowsOf(user));
        assertNotEquals(firstKey, objectKeyOf(user));
        verify(storage).delete(firstKey);
    }

    @Test
    @DisplayName("removing deletes the relation and the object; removing again is a no-op")
    void shouldRemovePhoto() throws Exception {
        UserDto user = createUser();
        upload(user, ProfilePhotoFormat.JPEG).andExpect(status().isOk());
        String key = objectKeyOf(user);

        mockMvc.perform(delete(PHOTO_URL).header(HttpHeaders.AUTHORIZATION, bearer(user)))
            .andExpect(status().isNoContent());
        mockMvc.perform(delete(PHOTO_URL).header(HttpHeaders.AUTHORIZATION, bearer(user)))
            .andExpect(status().isNoContent());

        assertEquals(0, photoRowsOf(user));
        verify(storage).delete(key);
    }

    @Test
    @DisplayName("an unsupported image is rejected before reaching the bucket")
    void shouldRejectUnsupportedType() throws Exception {
        UserDto user = createUser();
        MockMultipartFile svg = new MockMultipartFile("file", "photo.svg", "image/svg+xml", "<svg/>".getBytes());

        mockMvc.perform(multipart(HttpMethod.PUT, PHOTO_URL).file(svg)
                .header(HttpHeaders.AUTHORIZATION, bearer(user)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value(ProfilePhotoUpload.UNSUPPORTED_TYPE));

        verify(storage, never()).put(anyString(), any(byte[].class), anyString());
    }

    @Test
    @DisplayName("a photo over 1 MB is rejected")
    void shouldRejectTooLargePhoto() throws Exception {
        UserDto user = createUser();
        byte[] content = ProfilePhotoFixtures.ofSize(ProfilePhotoFormat.PNG, ProfilePhotoUpload.MAX_BYTES + 1);

        mockMvc.perform(multipart(HttpMethod.PUT, PHOTO_URL)
                .file(new MockMultipartFile("file", "big.png", "image/png", content))
                .header(HttpHeaders.AUTHORIZATION, bearer(user)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value(ProfilePhotoUpload.TOO_LARGE));
    }

    @Test
    @DisplayName("a request without a file is rejected with a domain code")
    void shouldRequireFile() throws Exception {
        UserDto user = createUser();

        mockMvc.perform(multipart(HttpMethod.PUT, PHOTO_URL).header(HttpHeaders.AUTHORIZATION, bearer(user)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value(ProfilePhotoUpload.REQUIRED));
    }

    @Test
    @DisplayName("a bucket failure while uploading leaves no relation behind")
    void shouldNotSaveWhenBucketFails() throws Exception {
        UserDto user = createUser();
        doThrow(new IllegalStateException("bucket down"))
            .when(storage).put(anyString(), any(byte[].class), anyString());

        upload(user, ProfilePhotoFormat.PNG).andExpect(status().isInternalServerError());

        assertEquals(0, photoRowsOf(user));
    }

    @Test
    @DisplayName("deleting the account removes the photo object from the bucket")
    void shouldRemoveObjectWithAccount() throws Exception {
        UserDto user = createUser();
        upload(user, ProfilePhotoFormat.PNG).andExpect(status().isOk());
        String key = objectKeyOf(user);

        mockMvc.perform(delete("/api/users/me").header(HttpHeaders.AUTHORIZATION, bearer(user)))
            .andExpect(status().isNoContent());

        assertEquals(0, photoRowsOf(user));
        verify(storage).delete(key);
    }

    @Test
    @DisplayName("requires authentication")
    void shouldRequireAuthentication() throws Exception {
        mockMvc.perform(get(PHOTO_URL)).andExpect(status().isUnauthorized());
    }

    private ResultActions upload(UserDto user, ProfilePhotoFormat format) throws Exception {
        MockMultipartFile file = new MockMultipartFile(
            "file", "photo." + format.extension(), format.mimeType(), ProfilePhotoFixtures.of(format));

        return mockMvc.perform(multipart(HttpMethod.PUT, PHOTO_URL).file(file)
            .header(HttpHeaders.AUTHORIZATION, bearer(user)));
    }

    private String objectKeyOf(UserDto user) {
        return jdbcTemplate.queryForObject(
            "SELECT object_key FROM user_profile_photos WHERE user_id = ?", String.class, user.getId());
    }

    private int photoRowsOf(UserDto user) {
        Integer rows = jdbcTemplate.queryForObject(
            "SELECT count(*) FROM user_profile_photos WHERE user_id = ?", Integer.class, user.getId());
        return rows == null ? 0 : rows;
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
