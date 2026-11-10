package com.gbatistadev.gymbro.errors.exceptions;

public class ForbiddenException extends ApiException {
	public ForbiddenException(String message) {
		super("FORBIDDEN", message);
	}
}
