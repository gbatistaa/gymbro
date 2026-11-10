package com.gbatistadev.gymbro.errors.exceptions;

public class NotFoundException extends ApiException {
	public NotFoundException(String message) {
		super("NOT_FOUND", message);
	}
}
