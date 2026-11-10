package com.gbatistadev.gymbro.errors.exceptions;

/**
 * Falha de domínio com um código estável, legível por máquina, que o cliente pode testar sem
 * parsear a mensagem.
 */
public abstract class ApiException extends RuntimeException {
	private final String code;

	protected ApiException(String code, String message) {
		super(message);
		this.code = code;
	}

	public String getCode() {
		return code;
	}
}
