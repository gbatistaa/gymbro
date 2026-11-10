package com.gbatistadev.gymbro.auth.dto;

/**
 * Par de tokens emitido no login e no refresh.
 *
 * <p>O refresh token é devolvido no corpo porque o cliente mobile guarda em armazenamento seguro
 * do dispositivo. A resposta que o contém sempre leva {@code Cache-Control: no-store}.
 */
public record AuthTokensDto(
    String accessToken,
    String tokenType,
    long expiresIn,
    String refreshToken
) {}
