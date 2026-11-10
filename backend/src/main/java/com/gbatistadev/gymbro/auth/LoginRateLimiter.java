package com.gbatistadev.gymbro.auth;

import com.gbatistadev.gymbro.errors.exceptions.RateLimitedException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Contador de falhas de login por (IP, e-mail).
 *
 * <p>Janela deslizante por chave, em memória. {@code shortcut: contador por instância; com mais de
 * um processo o limite efetivo vira max × instâncias — upgrade = store compartilhado}.
 *
 * <p>A chave inclui o e-mail porque só IP puniria todos os usuários atrás do mesmo NAT de operadora,
 * e só e-mail deixaria o ataque distribuído passar.
 */
@Component
public class LoginRateLimiter {
    private static final int PRUNE_THRESHOLD = 10_000;

    private record Window(int failures, Instant expiresAt) {
        boolean isExpired(Instant now) {
            return now.isAfter(expiresAt);
        }
    }

    private final Map<String, Window> windows = new ConcurrentHashMap<>();
    private final int maxAttempts;
    private final Duration window;

    public LoginRateLimiter(
        @Value("${app.auth.rate-limit.max-attempts:5}") int maxAttempts,
        @Value("${app.auth.rate-limit.window:PT15M}") Duration window
    ) {
        this.maxAttempts = maxAttempts;
        this.window = window;
    }

    /** Chamado antes de verificar credenciais, para não gastar BCrypt com quem já estourou. */
    public void checkAllowed(String key) {
        Instant now = Instant.now();
        Window current = windows.get(key);
        if (current == null) {
            return;
        }
        if (current.isExpired(now)) {
            windows.remove(key, current);
            return;
        }
        if (current.failures() >= maxAttempts) {
            long retryAfter = Math.max(1, Duration.between(now, current.expiresAt()).toSeconds());
            throw new RateLimitedException(retryAfter);
        }
    }

    public void recordFailure(String key) {
        Instant now = Instant.now();
        pruneIfCrowded(now);
        windows.compute(key, (ignored, current) ->
            current == null || current.isExpired(now)
                ? new Window(1, now.plus(window))
                : new Window(current.failures() + 1, current.expiresAt()));
    }

    public void reset(String key) {
        windows.remove(key);
    }

    // chave é (IP, e-mail): um atacante pode variar o e-mail, então o mapa precisa de poda
    private void pruneIfCrowded(Instant now) {
        if (windows.size() > PRUNE_THRESHOLD) {
            windows.entrySet().removeIf(entry -> entry.getValue().isExpired(now));
        }
    }
}
