package com.gbatistadev.gymbro.auth;

import com.gbatistadev.gymbro.auth.dto.AuthTokensDto;
import com.gbatistadev.gymbro.auth.dto.LoginDto;
import com.gbatistadev.gymbro.auth.dto.RefreshRequest;
import com.gbatistadev.gymbro.errors.exceptions.UnauthorizedException;
import com.gbatistadev.gymbro.user.dto.CreateUserDto;
import com.gbatistadev.gymbro.user.dto.UserDto;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
    private final LoginRateLimiter loginRateLimiter;

    @PostMapping("/register")
    public ResponseEntity<UserDto> register(@Valid @RequestBody CreateUserDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(dto));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthTokensDto> login(
        @Valid @RequestBody LoginDto dto,
        HttpServletRequest request
    ) {
        // verificar o limite antes de tocar em BCrypt evita que força bruta consuma CPU do servidor
        String rateLimitKey = request.getRemoteAddr() + "|" + dto.email();
        loginRateLimiter.checkAllowed(rateLimitKey);
        try {
            ResponseEntity<AuthTokensDto> response = authService.login(dto);
            loginRateLimiter.reset(rateLimitKey);
            return response;
        } catch (UnauthorizedException e) {
            loginRateLimiter.recordFailure(rateLimitKey);
            throw e;
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthTokensDto> refresh(
        @RequestBody(required = false) RefreshRequest request
    ) {
        return authService.refresh(request == null ? null : request.refreshToken());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
        @RequestBody(required = false) RefreshRequest request,
        @AuthenticationPrincipal UUID userId
    ) {
        return authService.logout(request == null ? null : request.refreshToken(), userId);
    }
}
