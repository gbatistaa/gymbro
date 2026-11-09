package com.gbatistadev.gymbro.config.security;

import com.gbatistadev.gymbro.config.jwt.JwtService;
import com.gbatistadev.gymbro.errors.exceptions.UnauthorizedException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (cookie.getName().equals("access_token")) {
                    try {
                        var userId = jwtService.parseAccessToken(cookie.getValue());
                        var authentication = UsernamePasswordAuthenticationToken.authenticated(
                            userId, null, List.of());
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    } catch (UnauthorizedException ignored) {
                        // Invalid/expired token remains unauthenticated; Security's entry point returns 401.
                    }
                    break;
                }
            }
        }
        filterChain.doFilter(request, response);
    }
}
