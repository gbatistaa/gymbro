package com.gbatistadev.gymbro.errors;

import com.gbatistadev.gymbro.errors.exceptions.BadRequestException;
import com.gbatistadev.gymbro.errors.exceptions.ConflictException;
import com.gbatistadev.gymbro.errors.exceptions.ForbiddenException;
import com.gbatistadev.gymbro.errors.exceptions.NotFoundException;
import com.gbatistadev.gymbro.errors.exceptions.RateLimitedException;
import com.gbatistadev.gymbro.errors.exceptions.ResourceAlreadyExistsException;
import com.gbatistadev.gymbro.errors.exceptions.UnauthorizedException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.support.DefaultMessageSourceResolvable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {
	private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

	@ExceptionHandler(NotFoundException.class)
	public ResponseEntity<ErrorResponse> handleNotFoundException(
		NotFoundException ex,
		HttpServletRequest request
	) {
		return respond(HttpStatus.NOT_FOUND, ex.getCode(), ex.getMessage(), request);
	}

	@ExceptionHandler(ForbiddenException.class)
	public ResponseEntity<ErrorResponse> handleForbiddenException(
		ForbiddenException ex,
		HttpServletRequest request
	) {
		return respond(HttpStatus.FORBIDDEN, ex.getCode(), ex.getMessage(), request);
	}

	@ExceptionHandler(UnauthorizedException.class)
	public ResponseEntity<ErrorResponse> handleUnauthorizedException(
		UnauthorizedException ex,
		HttpServletRequest request
	) {
		return respond(HttpStatus.UNAUTHORIZED, ex.getCode(), ex.getMessage(), request);
	}

	@ExceptionHandler(BadRequestException.class)
	public ResponseEntity<ErrorResponse> handleBadRequestException(
		BadRequestException ex,
		HttpServletRequest request
	) {
		return respond(HttpStatus.BAD_REQUEST, ex.getCode(), ex.getMessage(), request);
	}

	@ExceptionHandler(ConflictException.class)
	public ResponseEntity<ErrorResponse> handleConflictException(
		ConflictException ex,
		HttpServletRequest request
	) {
		return respond(HttpStatus.CONFLICT, ex.getCode(), ex.getMessage(), request);
	}

	@ExceptionHandler(ResourceAlreadyExistsException.class)
	public ResponseEntity<ErrorResponse> handleResourceAlreadyExistsException(
		ResourceAlreadyExistsException ex,
		HttpServletRequest request
	) {
		return respond(HttpStatus.CONFLICT, ex.getCode(), ex.getMessage(), request);
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ErrorResponse> handleMethodArgumentNotValidException(
		MethodArgumentNotValidException ex,
		HttpServletRequest request
	) {
		List<FieldErrorDto> errors = ex.getBindingResult()
			.getFieldErrors()
			.stream()
			.map(fieldError -> new FieldErrorDto(fieldError.getField(), fieldError.getDefaultMessage()))
			.toList();

		String message = ex.getBindingResult()
			.getFieldErrors()
			.stream()
			.map(DefaultMessageSourceResolvable::getDefaultMessage)
			.collect(Collectors.joining("; "));

		return respond(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", message, errors, request);
	}

	@ExceptionHandler(ConstraintViolationException.class)
	public ResponseEntity<ErrorResponse> handleConstraintViolationException(
		ConstraintViolationException ex,
		HttpServletRequest request
	) {
		List<FieldErrorDto> errors = ex.getConstraintViolations()
			.stream()
			.map(violation -> new FieldErrorDto(
				violation.getPropertyPath().toString(),
				violation.getMessage()))
			.toList();

		return respond(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", ex.getMessage(), errors, request);
	}

	@ExceptionHandler(HttpMessageNotReadableException.class)
	public ResponseEntity<ErrorResponse> handleHttpMessageNotReadableException(
		HttpMessageNotReadableException ex,
		HttpServletRequest request
	) {
		return respond(HttpStatus.BAD_REQUEST, "MALFORMED_BODY", "Malformed or invalid request body", request);
	}

	@ExceptionHandler({
		MethodArgumentTypeMismatchException.class,
		MissingServletRequestParameterException.class
	})
	public ResponseEntity<ErrorResponse> handleBadRequestException(
		Exception ex,
		HttpServletRequest request
	) {
		return respond(HttpStatus.BAD_REQUEST, "INVALID_PARAMETER", ex.getMessage(), request);
	}

	@ExceptionHandler(HttpMediaTypeNotSupportedException.class)
	public ResponseEntity<ErrorResponse> handleHttpMediaTypeNotSupportedException(
		HttpMediaTypeNotSupportedException ex,
		HttpServletRequest request
	) {
		return respond(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "UNSUPPORTED_MEDIA_TYPE", ex.getMessage(), request);
	}

	@ExceptionHandler(HttpRequestMethodNotSupportedException.class)
	public ResponseEntity<ErrorResponse> handleHttpRequestMethodNotSupportedException(
		HttpRequestMethodNotSupportedException ex,
		HttpServletRequest request
	) {
		return respond(HttpStatus.METHOD_NOT_ALLOWED, "METHOD_NOT_ALLOWED", ex.getMessage(), request);
	}

	@ExceptionHandler(NoResourceFoundException.class)
	public ResponseEntity<ErrorResponse> handleNoResourceFoundException(
		NoResourceFoundException ex,
		HttpServletRequest request
	) {
		return respond(HttpStatus.NOT_FOUND, "NOT_FOUND", "Resource not found", request);
	}

	@ExceptionHandler(MaxUploadSizeExceededException.class)
	public ResponseEntity<ErrorResponse> handleMaxUploadSizeExceededException(
		MaxUploadSizeExceededException ex,
		HttpServletRequest request
	) {
		return respond(HttpStatus.PAYLOAD_TOO_LARGE, "PAYLOAD_TOO_LARGE", "File is too large", request);
	}

	@ExceptionHandler(DataIntegrityViolationException.class)
	public ResponseEntity<ErrorResponse> handleDataIntegrityViolationException(
		DataIntegrityViolationException ex,
		HttpServletRequest request
	) {
		return respond(HttpStatus.CONFLICT, "DATA_CONFLICT",
			"The request conflicts with the current state of the resource", request);
	}

	@ExceptionHandler(OptimisticLockingFailureException.class)
	public ResponseEntity<ErrorResponse> handleOptimisticLockingFailureException(
		OptimisticLockingFailureException ex,
		HttpServletRequest request
	) {
		return respond(HttpStatus.CONFLICT, "STALE_WRITE",
			"The resource was modified by another request", request);
	}

	@ExceptionHandler(AuthenticationException.class)
	public ResponseEntity<ErrorResponse> handleAuthenticationException(
		AuthenticationException ex,
		HttpServletRequest request
	) {
		return respond(HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED", ex.getMessage(), request);
	}

	@ExceptionHandler(AccessDeniedException.class)
	public ResponseEntity<ErrorResponse> handleAccessDeniedException(
		AccessDeniedException ex,
		HttpServletRequest request
	) {
		return respond(HttpStatus.FORBIDDEN, "FORBIDDEN", ex.getMessage(), request);
	}

	@ExceptionHandler(RateLimitedException.class)
	public ResponseEntity<ErrorResponse> handleRateLimitedException(
		RateLimitedException ex,
		HttpServletRequest request
	) {
		return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
			.header(HttpHeaders.RETRY_AFTER, String.valueOf(ex.getRetryAfterSeconds()))
			.body(new ErrorResponse(
				LocalDateTime.now(),
				HttpStatus.TOO_MANY_REQUESTS.value(),
				ex.getCode(),
				ex.getMessage(),
				request.getRequestURI(),
				List.of()));
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ErrorResponse> handleUnexpectedException(
		Exception ex,
		HttpServletRequest request
	) {
		log.error("Unhandled exception on {}", request.getRequestURI(), ex);

		return respond(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR",
			"An unexpected error occurred", request);
	}

	private ResponseEntity<ErrorResponse> respond(
		HttpStatus httpStatus,
		String code,
		String message,
		HttpServletRequest request
	) {
		return respond(httpStatus, code, message, List.of(), request);
	}

	private ResponseEntity<ErrorResponse> respond(
		HttpStatus httpStatus,
		String code,
		String message,
		List<FieldErrorDto> errors,
		HttpServletRequest request
	) {
		return new ResponseEntity<>(
			new ErrorResponse(
				LocalDateTime.now(),
				httpStatus.value(),
				code,
				message,
				request.getRequestURI(),
				errors),
			httpStatus);
	}
}
