package com.gbatistadev.gymbro.errors.exceptions;

public class BadRequestException extends ApiException {
    public BadRequestException(String message) {
        super("BAD_REQUEST", message);
    }
}
