package com.gbatistadev.gymbro.user.photo;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Optional;

/**
 * Formatos aceitos para a foto de perfil. O formato é reconhecido pela assinatura dos primeiros
 * bytes, nunca pelo nome ou pelo Content-Type enviado pelo cliente.
 */
public enum ProfilePhotoFormat {
    PNG("image/png", "png"),
    JPEG("image/jpeg", "jpg"),
    GIF("image/gif", "gif"),
    WEBP("image/webp", "webp");

    private static final byte[] PNG_SIGNATURE = {(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n'};
    private static final byte[] JPEG_SIGNATURE = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
    private static final byte[] GIF87_SIGNATURE = ascii("GIF87a");
    private static final byte[] GIF89_SIGNATURE = ascii("GIF89a");
    private static final byte[] RIFF_SIGNATURE = ascii("RIFF");
    private static final byte[] WEBP_SIGNATURE = ascii("WEBP");
    // RIFF guarda o tamanho do arquivo nos bytes 4–7; o tipo do contêiner vem logo depois
    private static final int WEBP_SIGNATURE_OFFSET = 8;

    private final String mimeType;
    private final String extension;

    ProfilePhotoFormat(String mimeType, String extension) {
        this.mimeType = mimeType;
        this.extension = extension;
    }

    public String mimeType() {
        return mimeType;
    }

    public String extension() {
        return extension;
    }

    public static Optional<ProfilePhotoFormat> detect(byte[] content) {
        return Arrays.stream(values())
            .filter(format -> format.matches(content))
            .findFirst();
    }

    private boolean matches(byte[] content) {
        return switch (this) {
            case PNG -> startsWith(content, 0, PNG_SIGNATURE);
            case JPEG -> startsWith(content, 0, JPEG_SIGNATURE);
            case GIF -> startsWith(content, 0, GIF87_SIGNATURE) || startsWith(content, 0, GIF89_SIGNATURE);
            case WEBP -> startsWith(content, 0, RIFF_SIGNATURE)
                && startsWith(content, WEBP_SIGNATURE_OFFSET, WEBP_SIGNATURE);
        };
    }

    private static boolean startsWith(byte[] content, int offset, byte[] signature) {
        if (content.length < offset + signature.length) {
            return false;
        }
        return Arrays.equals(
            content, offset, offset + signature.length,
            signature, 0, signature.length);
    }

    private static byte[] ascii(String text) {
        return text.getBytes(StandardCharsets.US_ASCII);
    }
}
