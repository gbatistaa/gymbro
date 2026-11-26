package com.gbatistadev.gymbro.user.photo;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;

/** Bytes mínimos que começam com a assinatura de cada formato — o suficiente para a detecção. */
final class ProfilePhotoFixtures {

    private ProfilePhotoFixtures() {
    }

    static byte[] of(ProfilePhotoFormat format) {
        return ofSize(format, 32);
    }

    static byte[] ofSize(ProfilePhotoFormat format, int size) {
        byte[] header = header(format);
        return Arrays.copyOf(header, Math.max(size, header.length));
    }

    private static byte[] header(ProfilePhotoFormat format) {
        return switch (format) {
            case PNG -> new byte[] {(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n'};
            case JPEG -> new byte[] {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0};
            case GIF -> "GIF89a".getBytes(StandardCharsets.US_ASCII);
            case WEBP -> "RIFF\0\0\0\0WEBPVP8 ".getBytes(StandardCharsets.US_ASCII);
        };
    }
}
