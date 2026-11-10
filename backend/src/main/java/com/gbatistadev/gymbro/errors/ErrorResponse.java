package com.gbatistadev.gymbro.errors;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Corpo único de erro da API.
 *
 * <p>{@code code} é estável e feito para o cliente testar; {@code message} é texto para humano e
 * pode mudar sem aviso. {@code errors} nunca é {@code null}: vem vazio quando o erro não é de
 * campo, para que o shape da resposta não varie.
 */
public record ErrorResponse(
	LocalDateTime timestamp,
	int status,
	String code,
	String message,
	String path,
	List<FieldErrorDto> errors
) {}
