package com.gbatistadev.gymbro.errors;

/**
 * Erro de validação de um campo específico, para que o cliente posicione a mensagem embaixo do input.
 */
public record FieldErrorDto(String field, String message) {}
