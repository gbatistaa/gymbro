package com.gbatistadev.gymbro.errors.exceptions;

public class BadRequestException extends ApiException {
    public BadRequestException(String message) {
        super("BAD_REQUEST", message);
    }

    /** Entrada inválida com um código de domínio próprio, quando o cliente precisa distinguir a causa. */
    public BadRequestException(String code, String message) {
        super(code, message);
    }
}
