package com.gbatistadev.gymbro.errors;

import com.gbatistadev.gymbro.errors.exceptions.NotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;

@RestControllerAdvice
public class GlobalExceptionHandler {
	@ExceptionHandler(NotFoundException.class)
	public ResponseEntity<ErrorResponse> handleNotFoundException(NotFoundException ex) {
		ErrorResponse errorResponse = buildError(
			HttpStatus.NOT_FOUND,
			ex.getMessage(),

		)
	}

	private ErrorResponse buildError(
		HttpStatus httpStatus,
		String message,
		HttpServletRequest request
	) {
		return new ErrorResponse(
			LocalDateTime.now(),
			httpStatus.value(),
			message,
			request.getRequestURI()
		);

	}
}
