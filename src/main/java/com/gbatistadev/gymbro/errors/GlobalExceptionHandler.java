package com.gbatistadev.gymbro.errors;

import com.gbatistadev.gymbro.errors.exceptions.ForbiddenException;
import com.gbatistadev.gymbro.errors.exceptions.NotFoundException;
import com.gbatistadev.gymbro.errors.exceptions.ResourceAlreadyExistsException;
import com.gbatistadev.gymbro.errors.exceptions.UnauthorizedException;
import jakarta.servlet.http.HttpServletRequest;
import jdk.jshell.ErroneousSnippet;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;

@RestControllerAdvice
public class GlobalExceptionHandler {
	@ExceptionHandler(NotFoundException.class)
	public ResponseEntity<ErrorResponse> handleNotFoundException(
		NotFoundException ex,
		HttpServletRequest request
	) {
		ErrorResponse errorResponse = buildError(
			HttpStatus.NOT_FOUND,
			ex.getMessage(),
			request
		);

		return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
	}

	@ExceptionHandler(ForbiddenException.class)
	public ResponseEntity<ErrorResponse> handleForbiddenException(
		ForbiddenException ex,
		HttpServletRequest request
	) {
		ErrorResponse errorResponse = buildError(
			HttpStatus.FORBIDDEN,
			ex.getMessage(),
			request
		);

		return new ResponseEntity<>(errorResponse, HttpStatus.FORBIDDEN);
	}

	@ExceptionHandler(UnauthorizedException.class)
	public ResponseEntity<ErrorResponse> handleUnauthorizedException(
		UnauthorizedException ex,
		HttpServletRequest request
	) {
		ErrorResponse errorResponse = buildError(
			HttpStatus.UNAUTHORIZED,
			ex.getMessage(),
			request
		);

		return new ResponseEntity<>(errorResponse, HttpStatus.UNAUTHORIZED);
	}

	@ExceptionHandler(ResourceAlreadyExistsException.class)
	public ResponseEntity<ErrorResponse> handleResourceAlreadyExistsException(
		ResourceAlreadyExistsException ex,
		HttpServletRequest request
	) {
		ErrorResponse errorResponse = buildError(
			HttpStatus.CONFLICT,
			ex.getMessage(),
			request
		);

		return new ResponseEntity<>(errorResponse, HttpStatus.CONFLICT);
	}

	private ErrorResponse buildError(
		HttpStatus httpStatus,
		String message,
		HttpServletRequest request
	) {
		return new ErrorResponse(
			LocalDateTime.now(),
			httpStatus.value(),
			httpStatus.name(),
			message,
			request.getRequestURI()
		);

	}
}
