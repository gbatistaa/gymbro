package com.gbatistadev.gymbro.user.photo;

import com.gbatistadev.gymbro.errors.exceptions.BadRequestException;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/** Arquivo enviado como foto de perfil, já validado: tem conteúdo, cabe no limite e é imagem aceita. */
public record ProfilePhotoUpload(byte[] content, ProfilePhotoFormat format) {
    public static final int MAX_BYTES = 1024 * 1024;

    public static final String REQUIRED = "PROFILE_PHOTO_REQUIRED";
    public static final String TOO_LARGE = "PROFILE_PHOTO_TOO_LARGE";
    public static final String UNSUPPORTED_TYPE = "PROFILE_PHOTO_UNSUPPORTED_TYPE";

    public static ProfilePhotoUpload from(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException(REQUIRED, "A photo file is required");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new BadRequestException(TOO_LARGE, "The photo must be at most 1 MB");
        }

        byte[] content = read(file);
        ProfilePhotoFormat format = ProfilePhotoFormat.detect(content)
            .orElseThrow(() -> new BadRequestException(
                UNSUPPORTED_TYPE, "The photo must be a PNG, JPEG, WEBP or GIF image"));

        return new ProfilePhotoUpload(content, format);
    }

    public int sizeBytes() {
        return content.length;
    }

    private static byte[] read(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException e) {
            throw new BadRequestException("Could not read the uploaded file");
        }
    }
}
