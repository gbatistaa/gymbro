package com.gbatistadev.gymbro.errors.exceptions;

public class ResourceAlreadyExistsException extends ApiException {
	public ResourceAlreadyExistsException(String message) {
		super("RESOURCE_ALREADY_EXISTS", message);
	}
}
