package com.gbatistadev.gymbro.auth;

import com.gbatistadev.gymbro.user.dto.UserDto;

/**
 * Resultado interno de login/registro/refresh. Os tokens viram cookies no controller e nunca
 * aparecem no corpo da resposta.
 */
public record AuthSession(UserDto user, String accessToken, String refreshToken) {}
