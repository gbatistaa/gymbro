package com.gbatistadev.gymbro.errors.exceptions;

/**
 * Parâmetro {@code sort} fora da whitelist. É 400 com {@code VALIDATION_FAILED} para o cliente
 * tratar como erro de entrada, sem adivinhar mensagem.
 */
public class InvalidSortException extends ApiException {
	public InvalidSortException(String value) {
		super("VALIDATION_FAILED", "Invalid sort: " + value);
	}
}
