package com.gbatistadev.gymbro.auth;

import com.gbatistadev.gymbro.auth.dto.AuthTokensDto;
import com.gbatistadev.gymbro.auth.dto.LoginDto;
import com.gbatistadev.gymbro.config.jwt.JwtProperties;
import com.gbatistadev.gymbro.config.jwt.JwtService;
import com.gbatistadev.gymbro.errors.exceptions.UnauthorizedException;
import com.gbatistadev.gymbro.user.RefreshToken;
import com.gbatistadev.gymbro.user.RefreshTokenRepository;
import com.gbatistadev.gymbro.user.User;
import com.gbatistadev.gymbro.user.UserRepository;
import com.gbatistadev.gymbro.user.UserService;
import com.gbatistadev.gymbro.user.dto.CreateUserDto;
import com.gbatistadev.gymbro.user.dto.UserDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
public class AuthService {
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserService userService;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;

    public UserDto register(CreateUserDto dto) {
        return userService.create(dto);
    }

    @Transactional
    public ResponseEntity<AuthTokensDto> login(LoginDto dto) {
        User user = userRepository.findByEmail(dto.email())
            .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));

        if (!passwordEncoder.matches(dto.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid credentials");
        }

        String refreshToken = generateRefreshToken();
        saveRefreshToken(user, refreshToken);
        String accessToken = jwtService.createAccessToken(user.getId(), user.getEmail());

        return tokensResponse(accessToken, refreshToken);
    }

    // rotação de refresh não implementada (open question do plan); upgrade = trocar o hash a cada uso
    @Transactional(readOnly = true)
    public ResponseEntity<AuthTokensDto> refresh(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw new UnauthorizedException("Invalid refresh token");
        }

        RefreshToken refreshToken = refreshTokenRepository
            .findValidByTokenHash(sha256Hex(rawRefreshToken), Instant.now())
            .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        User user = refreshToken.getUser();
        String accessToken = jwtService.createAccessToken(user.getId(), user.getEmail());

        return tokensResponse(accessToken, rawRefreshToken);
    }

    // no-store: a resposta carrega credenciais e não pode ser gravada por cache de proxy ou navegador
    private ResponseEntity<AuthTokensDto> tokensResponse(String accessToken, String refreshToken) {
        return ResponseEntity.ok()
            .header(HttpHeaders.CACHE_CONTROL, "no-store")
            .body(new AuthTokensDto(
                accessToken,
                "Bearer",
                jwtProperties.expirationMs() / 1000,
                refreshToken));
    }

    private String generateRefreshToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private void saveRefreshToken(User user, String rawToken) {
        RefreshToken refreshToken = refreshTokenRepository.findByUserId(user.getId())
            .orElseGet(() -> {
                RefreshToken created = new RefreshToken();
                created.setUser(user);
                return created;
            });
        refreshToken.setTokenHash(sha256Hex(rawToken));
        refreshToken.setExpiresAt(Instant.now().plusMillis(jwtProperties.refreshExpirationMs()));
        refreshTokenRepository.save(refreshToken);
    }

    private String sha256Hex(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
