package com.gbatistadev.gymbro.auth;

import com.gbatistadev.gymbro.auth.dto.LoginDto;
import com.gbatistadev.gymbro.errors.exceptions.UnauthorizedException;
import com.gbatistadev.gymbro.user.dto.CreateUserDto;
import com.gbatistadev.gymbro.user.dto.UserDto;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    private final AuthCookies authCookies;
    private final LoginRateLimiter loginRateLimiter;

    @PostMapping("/register")
    public ResponseEntity<UserDto> register(@Valid @RequestBody CreateUserDto dto) {
        return sessionResponse(HttpStatus.CREATED, authService.register(dto));
    }

    @PostMapping("/login")
    public ResponseEntity<UserDto> login(
        @Valid @RequestBody LoginDto dto,
        HttpServletRequest request
    ) {
        // verificar o limite antes de tocar em BCrypt evita que força bruta consuma CPU do servidor
        String rateLimitKey = request.getRemoteAddr() + "|" + dto.identifier().toLowerCase();
        loginRateLimiter.checkAllowed(rateLimitKey);
        try {
            ResponseEntity<UserDto> response = sessionResponse(HttpStatus.OK, authService.login(dto));
            loginRateLimiter.reset(rateLimitKey);
            return response;
        } catch (UnauthorizedException e) {
            loginRateLimiter.recordFailure(rateLimitKey);
            throw e;
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<Void> refresh(
        @CookieValue(name = AuthCookies.REFRESH, required = false) String refreshToken
    ) {
        AuthSession session = authService.refresh(refreshToken);

        return ResponseEntity.noContent()
            .header(HttpHeaders.CACHE_CONTROL, "no-store")
            .header(HttpHeaders.SET_COOKIE, authCookies.access(session.accessToken()).toString())
            .build();
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
        @CookieValue(name = AuthCookies.REFRESH, required = false) String refreshToken,
        @AuthenticationPrincipal UUID userId
    ) {
        authService.logout(refreshToken, userId);

        return ResponseEntity.noContent()
            .header(
                HttpHeaders.SET_COOKIE,
                authCookies.clearAccess().toString(),
                authCookies.clearRefresh().toString())
            .build();
    }

    private ResponseEntity<UserDto> sessionResponse(HttpStatus status, AuthSession session) {
        return ResponseEntity.status(status)
            .header(HttpHeaders.CACHE_CONTROL, "no-store")
            .header(
                HttpHeaders.SET_COOKIE,
                authCookies.access(session.accessToken()).toString(),
                authCookies.refresh(session.refreshToken()).toString())
            .body(session.user());
    }
}
