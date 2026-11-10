package com.gbatistadev.gymbro.config.security;

import com.gbatistadev.gymbro.config.jwt.JwtService;
import com.gbatistadev.gymbro.errors.exceptions.UnauthorizedException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private static final String BEARER_SCHEME = "Bearer";

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        String token = bearerToken(request.getHeader(HttpHeaders.AUTHORIZATION));
        if (token != null) {
            try {
                var userId = jwtService.parseAccessToken(token);
                var authentication = UsernamePasswordAuthenticationToken.authenticated(
                    userId, null, List.of());
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (UnauthorizedException ignored) {
                // Invalid/expired token remains unauthenticated; Security's entry point returns 401.
            }
        }
        filterChain.doFilter(request, response);
    }

    // RFC 7235: o nome do esquema é case-insensitive; o token nunca é logado.
    private String bearerToken(String header) {
        if (header == null) {
            return null;
        }
        int separator = header.indexOf(' ');
        if (separator < 0 || !header.substring(0, separator).equalsIgnoreCase(BEARER_SCHEME)) {
            return null;
        }
        String token = header.substring(separator + 1).trim();
        return token.isEmpty() ? null : token;
    }
}
