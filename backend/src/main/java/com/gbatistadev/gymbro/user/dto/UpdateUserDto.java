package com.gbatistadev.gymbro.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.io.Serializable;

/**
 * Partial update DTO for {@link com.gbatistadev.gymbro.user.User}; null fields are left untouched.
 * Password change is not implemented here.
 */
public record UpdateUserDto(
    @NotBlank(message = "Name must not be blank")
    String name,

    @Email(message = "Email must be valid")
    String email
) implements Serializable {}
