package com.gbatistadev.gymbro.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.io.Serializable;

/**
 * DTO for creation of {@link com.gbatistadev.gymbro.user.User}
 */
public record CreateUserDto(
    @NotBlank(message = "Name is required")
    String name,

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 30, message = "Use de 3 a 30 caracteres: letras, números, ponto ou sublinhado.")
    @Pattern(
        regexp = "^[A-Za-z0-9_]([A-Za-z0-9_.]*[A-Za-z0-9_])?$",
        message = "Use de 3 a 30 caracteres: letras, números, ponto ou sublinhado.")
    String username,

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    String email,

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must have at least 8 characters")
    String password
) implements Serializable {}
