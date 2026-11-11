package com.gbatistadev.gymbro.auth;

import com.gbatistadev.gymbro.auth.dto.LoginDto;
import com.gbatistadev.gymbro.config.jwt.JwtProperties;
import com.gbatistadev.gymbro.config.jwt.JwtService;
import com.gbatistadev.gymbro.errors.exceptions.UnauthorizedException;
import com.gbatistadev.gymbro.user.RefreshToken;
import com.gbatistadev.gymbro.user.RefreshTokenRepository;
import com.gbatistadev.gymbro.user.User;
import com.gbatistadev.gymbro.user.UserMapper;
import com.gbatistadev.gymbro.user.UserRepository;
import com.gbatistadev.gymbro.user.UserService;
import com.gbatistadev.gymbro.user.dto.CreateUserDto;
import com.gbatistadev.gymbro.user.dto.UserDto;
import lombok.RequiredArgsConstructor;
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
import java.util.UUID;

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
    private final UserMapper userMapper;

    /**
     * Cria a conta e já abre a sessão. O cadastro do PWA não deve exigir um segundo login.
     */
    @Transactional
    public AuthSession register(CreateUserDto dto) {
        UserDto userDto = userService.create(dto);
        User user = userRepository.findByEmail(dto.email())
            .orElseThrow(() -> new IllegalStateException("User missing after registration"));

        return issueSession(user, userDto);
    }

    @Transactional
    public AuthSession login(LoginDto dto) {
        User user = userRepository.findByEmail(dto.email())
            .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));

        if (!passwordEncoder.matches(dto.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid credentials");
        }

        return issueSession(user, userMapper.toDto(user));
    }

    // rotação de refresh não implementada (open question do plan); upgrade = trocar o hash a cada uso
    @Transactional(readOnly = true)
    public AuthSession refresh(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw new UnauthorizedException("Invalid refresh token");
        }

        RefreshToken refreshToken = refreshTokenRepository
            .findValidByTokenHash(sha256Hex(rawRefreshToken), Instant.now())
            .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        User user = refreshToken.getUser();
        String accessToken = jwtService.createAccessToken(user.getId(), user.getEmail());

        return new AuthSession(userMapper.toDto(user), accessToken, rawRefreshToken);
    }

    /**
     * Revoga a sessão. Com o refresh token do cookie, apaga aquele token — quem o possui já poderia
     * autenticar com ele, então a posse é a autorização. Sem refresh token no cookie, exige
     * autenticação e encerra todas as sessões do usuário.
     *
     * <p>O access token (JWT) continua válido até expirar: não há lista de revogação.
     * {@code shortcut: access token sem revogação, upgrade = jti + denylist até o exp}
     *
     * <p>Sempre 204, mesmo para um token inexistente, para não revelar se ele existia.
     */
    @Transactional
    public ResponseEntity<Void> logout(String rawRefreshToken, UUID userId) {
        if (rawRefreshToken != null && !rawRefreshToken.isBlank()) {
            String tokenHash = sha256Hex(rawRefreshToken);
            if (userId == null) {
                refreshTokenRepository.deleteByTokenHash(tokenHash);
            } else {
                // autenticado: só pode destruir sessão própria (defesa em profundidade contra IDOR)
                refreshTokenRepository.deleteByTokenHashAndUserId(tokenHash, userId);
            }
            return ResponseEntity.noContent().build();
        }

        if (userId == null) {
            throw new UnauthorizedException("Authentication required");
        }
        refreshTokenRepository.deleteByUserId(userId);
        return ResponseEntity.noContent().build();
    }

    private AuthSession issueSession(User user, UserDto userDto) {
        String refreshToken = generateRefreshToken();
        saveRefreshToken(user, refreshToken);
        String accessToken = jwtService.createAccessToken(user.getId(), user.getEmail());

        return new AuthSession(userDto, accessToken, refreshToken);
    }

    private String generateRefreshToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private void saveRefreshToken(User user, String rawToken) {
        // poda as sessões vencidas deste usuário: sem isso, um login diário acumularia linhas por 6 meses
        refreshTokenRepository.deleteExpiredByUserId(user.getId(), Instant.now());

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
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
