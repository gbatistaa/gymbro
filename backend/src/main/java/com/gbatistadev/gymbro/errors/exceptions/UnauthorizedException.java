package com.gbatistadev.gymbro.errors.exceptions;

public class UnauthorizedException extends ApiException {
	public UnauthorizedException(String message) {
		super("UNAUTHENTICATED", message);
	}
}
