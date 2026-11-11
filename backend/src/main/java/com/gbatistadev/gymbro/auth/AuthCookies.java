package com.gbatistadev.gymbro.auth;

import com.gbatistadev.gymbro.config.jwt.JwtProperties;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * Cookies de sessão do PWA.
 *
 * <p>O access token vive em um cookie HttpOnly com Path /api; o refresh token fica restrito a
 * /api/auth. SameSite=Strict impede o envio em requisições cross-site, que é a defesa de CSRF
 * enquanto a API usa cookies. Em produção, a publicação deve ser same-site e o cookie deve ir com
 * Secure=true; para domínios realmente distintos, configure None + Secure e proteja com CSRF token.
 */
@Component
public class AuthCookies {
    public static final String ACCESS = "gymbro_access";
    public static final String REFRESH = "gymbro_refresh";

    private static final String ACCESS_PATH = "/api";
    private static final String REFRESH_PATH = "/api/auth";

    private final JwtProperties jwtProperties;
    private final boolean secure;
    private final String sameSite;
    private final String domain;

    public AuthCookies(
        JwtProperties jwtProperties,
        @Value("${app.auth.cookie.secure:false}") boolean secure,
        @Value("${app.auth.cookie.same-site:Strict}") String sameSite,
        @Value("${app.auth.cookie.domain:}") String domain
    ) {
        this.jwtProperties = jwtProperties;
        this.secure = secure;
        this.sameSite = sameSite;
        this.domain = domain;
    }

    public ResponseCookie access(String token) {
        return cookie(ACCESS, token, ACCESS_PATH, Duration.ofMillis(jwtProperties.expirationMs()));
    }

    public ResponseCookie refresh(String token) {
        return cookie(REFRESH, token, REFRESH_PATH, Duration.ofMillis(jwtProperties.refreshExpirationMs()));
    }

    public ResponseCookie clearAccess() {
        return cookie(ACCESS, "", ACCESS_PATH, Duration.ZERO);
    }

    public ResponseCookie clearRefresh() {
        return cookie(REFRESH, "", REFRESH_PATH, Duration.ZERO);
    }

    private ResponseCookie cookie(String name, String value, String path, Duration maxAge) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(name, value)
            .httpOnly(true)
            .secure(secure)
            .sameSite(sameSite)
            .path(path)
            .maxAge(maxAge);

        if (!domain.isBlank()) {
            builder.domain(domain);
        }

        return builder.build();
    }
}
