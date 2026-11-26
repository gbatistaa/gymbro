package com.gbatistadev.gymbro.user.photo;

import com.gbatistadev.gymbro.errors.exceptions.BadRequestException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.mock.web.MockMultipartFile;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

@DisplayName("Profile photo upload validation")
class ProfilePhotoUploadTest {

    @ParameterizedTest
    @EnumSource(ProfilePhotoFormat.class)
    @DisplayName("recognizes every accepted format by its signature")
    void shouldDetectAcceptedFormats(ProfilePhotoFormat format) {
        ProfilePhotoUpload upload = ProfilePhotoUpload.from(file(ProfilePhotoFixtures.of(format), "image/png"));

        assertEquals(format, upload.format());
    }

    @Test
    @DisplayName("ignores the declared content type and file name")
    void shouldTrustContentOverDeclaredType() {
        byte[] jpeg = ProfilePhotoFixtures.of(ProfilePhotoFormat.JPEG);
        MockMultipartFile disguised = new MockMultipartFile("file", "photo.png", "image/png", jpeg);

        assertEquals(ProfilePhotoFormat.JPEG, ProfilePhotoUpload.from(disguised).format());
    }

    @Test
    @DisplayName("rejects content that is not an accepted image even when it claims to be one")
    void shouldRejectUnsupportedContent() {
        MockMultipartFile svg = file("<svg xmlns=\"http://www.w3.org/2000/svg\"/>".getBytes(), "image/png");

        BadRequestException error = assertThrows(BadRequestException.class, () -> ProfilePhotoUpload.from(svg));

        assertEquals(ProfilePhotoUpload.UNSUPPORTED_TYPE, error.getCode());
    }

    @Test
    @DisplayName("rejects a RIFF container that is not WEBP")
    void shouldRejectNonWebpRiff() {
        byte[] wav = "RIFF\0\0\0\0WAVEfmt ".getBytes();

        BadRequestException error = assertThrows(BadRequestException.class,
            () -> ProfilePhotoUpload.from(file(wav, "image/webp")));

        assertEquals(ProfilePhotoUpload.UNSUPPORTED_TYPE, error.getCode());
    }

    @Test
    @DisplayName("accepts exactly 1 MB and rejects one byte more")
    void shouldEnforceSizeLimit() {
        byte[] atLimit = ProfilePhotoFixtures.ofSize(ProfilePhotoFormat.PNG, ProfilePhotoUpload.MAX_BYTES);
        byte[] overLimit = ProfilePhotoFixtures.ofSize(ProfilePhotoFormat.PNG, ProfilePhotoUpload.MAX_BYTES + 1);

        assertEquals(ProfilePhotoUpload.MAX_BYTES, ProfilePhotoUpload.from(file(atLimit, "image/png")).sizeBytes());
        BadRequestException error = assertThrows(BadRequestException.class,
            () -> ProfilePhotoUpload.from(file(overLimit, "image/png")));
        assertEquals(ProfilePhotoUpload.TOO_LARGE, error.getCode());
    }

    @Test
    @DisplayName("requires a non-empty file")
    void shouldRequireFile() {
        assertEquals(ProfilePhotoUpload.REQUIRED,
            assertThrows(BadRequestException.class, () -> ProfilePhotoUpload.from(null)).getCode());
        assertEquals(ProfilePhotoUpload.REQUIRED,
            assertThrows(BadRequestException.class, () -> ProfilePhotoUpload.from(file(new byte[0], "image/png"))).getCode());
    }

    private static MockMultipartFile file(byte[] content, String contentType) {
        return new MockMultipartFile("file", "photo", contentType, content);
    }
}
