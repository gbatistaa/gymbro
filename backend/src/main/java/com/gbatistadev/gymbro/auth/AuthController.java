package com.gbatistadev.gymbro.auth;

import com.gbatistadev.gymbro.auth.dto.LoginDto;
import com.gbatistadev.gymbro.user.dto.CreateUserDto;
import com.gbatistadev.gymbro.user.dto.UserDto;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<UserDto> register(@Valid @RequestBody CreateUserDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(dto));
    }

    @PostMapping("/login")
    public ResponseEntity<UserDto> login(@Valid @RequestBody LoginDto dto) {
        return authService.login(dto);
    }

    @PostMapping("/refresh")
    public ResponseEntity<UserDto> refresh(
        @CookieValue(value = "refresh_token", required = false) String refreshToken
    ) {
        return authService.refresh(refreshToken);
    }
}
