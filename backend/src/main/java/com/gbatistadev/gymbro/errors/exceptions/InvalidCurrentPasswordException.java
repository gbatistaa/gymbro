package com.gbatistadev.gymbro.errors.exceptions;

/**
 * Senha atual incorreta na troca de senha. É 400, nunca 401: responder 401 faria o interceptor do
 * PWA tratar como sessão expirada e deslogar o usuário.
 */
public class InvalidCurrentPasswordException extends ApiException {
	public InvalidCurrentPasswordException() {
		super("INVALID_CURRENT_PASSWORD", "Current password is incorrect");
	}
}
