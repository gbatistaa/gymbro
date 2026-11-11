package com.gbatistadev.gymbro.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.io.Serializable;

/**
 * Troca de senha autenticada. A senha atual é verificada em texto claro contra o hash; a nova passa
 * pelas mesmas regras do cadastro.
 */
public record UpdatePasswordRequest(
    @NotBlank(message = "Current password is required")
    String currentPassword,

    @NotBlank(message = "New password is required")
    @Size(min = 8, message = "New password must have at least 8 characters")
    String newPassword
) implements Serializable {}
