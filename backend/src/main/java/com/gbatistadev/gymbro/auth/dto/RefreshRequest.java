package com.gbatistadev.gymbro.auth.dto;

/**
 * Corpo do {@code POST /api/auth/refresh}.
 *
 * <p>Sem constraints de validação de propósito: token ausente, em branco ou inválido é credencial
 * inválida (401), não payload malformado (400).
 */
public record RefreshRequest(String refreshToken) {}
