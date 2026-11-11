package com.gbatistadev.gymbro.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.io.Serializable;

/**
 * DTO for {@code POST /api/auth/login}. O identificador aceita e-mail ou username.
 */
public record LoginDto(
    @NotBlank(message = "Identifier is required")
    @Size(max = 254, message = "Identifier must have at most 254 characters")
    String identifier,

    @NotBlank(message = "Password is required")
    String password
) implements Serializable {}
