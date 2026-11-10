package com.gbatistadev.gymbro.errors.exceptions;

/** Limite de tentativas excedido; carrega quantos segundos o cliente deve esperar. */
public class RateLimitedException extends ApiException {
    private final long retryAfterSeconds;

    public RateLimitedException(long retryAfterSeconds) {
        super("TOO_MANY_ATTEMPTS", "Too many attempts. Try again later.");
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public long getRetryAfterSeconds() {
        return retryAfterSeconds;
    }
}
