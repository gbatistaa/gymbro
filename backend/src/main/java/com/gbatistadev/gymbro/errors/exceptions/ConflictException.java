package com.gbatistadev.gymbro.errors.exceptions;

public class ConflictException extends ApiException {
    public ConflictException(String message) {
        super("CONFLICT", message);
    }

    /** Conflito com um código de domínio próprio, quando o cliente precisa distinguir a causa. */
    public ConflictException(String code, String message) {
        super(code, message);
    }
}
