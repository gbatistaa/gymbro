package com.gbatistadev.gymbro.user.dto;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Valida um identificador IANA de fuso horário ({@code America/Sao_Paulo}).
 *
 * <p>Formato de texto não basta: só {@code ZoneId.of} distingue um fuso real de um inventado.
 */
@Documented
@Constraint(validatedBy = ZoneIdValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT, ElementType.ANNOTATION_TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidZoneId {
    String message() default "Time zone must be a valid IANA zone, e.g. America/Sao_Paulo";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
