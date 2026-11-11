package com.gbatistadev.gymbro.errors.exceptions;

/**
 * Conflito de unicidade. Quando o conflito pertence a um campo do formulário, {@code field} permite
 * que o cliente mostre a mensagem embaixo do input em vez de só no topo.
 */
public class ResourceAlreadyExistsException extends ApiException {
	private final String field;

	public ResourceAlreadyExistsException(String message) {
		this(message, null);
	}

	public ResourceAlreadyExistsException(String message, String field) {
		super("RESOURCE_ALREADY_EXISTS", message);
		this.field = field;
	}

	public String getField() {
		return field;
	}
}
