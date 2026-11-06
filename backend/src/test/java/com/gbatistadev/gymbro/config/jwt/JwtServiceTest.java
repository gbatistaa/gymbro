package com.gbatistadev.gymbro.config.jwt;

import com.gbatistadev.gymbro.errors.exceptions.UnauthorizedException;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import com.nimbusds.jose.proc.SecurityContext;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

@DisplayName("JwtService test class")
class JwtServiceTest {

    // >= 32 bytes, exigido para HS256
    private static final String SECRET = "test-secret-0123456789012345678901234567890123456789";

    private JwtService service(long expirationMs) {
        return new JwtService(new JwtProperties(SECRET, expirationMs, 15_552_000_000L));
    }

    @Test
    @DisplayName("create then parse returns the same user id")
    void shouldRoundtripUserId() {
        JwtService service = service(900_000L);
        UUID id = UUID.randomUUID();

        String token = service.createAccessToken(id, "joao@example.com");

        assertEquals(id, service.parseAccessToken(token));
    }

    @Test
    @DisplayName("token with tampered signature is rejected")
    void shouldRejectTamperedToken() {
        JwtService service = service(900_000L);
        String token = service.createAccessToken(UUID.randomUUID(), "joao@example.com");
        int sigStart = token.lastIndexOf('.') + 1;
        char first = token.charAt(sigStart);
        String tampered = token.substring(0, sigStart)
            + (first == 'A' ? 'B' : 'A')
            + token.substring(sigStart + 1);

        assertThrows(UnauthorizedException.class, () -> service.parseAccessToken(tampered));
    }

    @Test
    @DisplayName("expired token is rejected")
    void shouldRejectExpiredToken() {
        JwtService service = service(900_000L);
        // expirado há 4min (> clock skew de 60s do decoder); o builder do Nimbus exige exp > iat
        SecretKeySpec key = new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        NimbusJwtEncoder encoder = new NimbusJwtEncoder(new ImmutableSecret<SecurityContext>(key));
        Instant now = Instant.now();
        JwtClaimsSet expired = JwtClaimsSet.builder()
            .subject(UUID.randomUUID().toString())
            .issuedAt(now.minusSeconds(300))
            .expiresAt(now.minusSeconds(240))
            .build();
        String token = encoder.encode(
            JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), expired)
        ).getTokenValue();

        assertThrows(UnauthorizedException.class, () -> service.parseAccessToken(token));
    }

    @Test
    @DisplayName("malformed token is rejected")
    void shouldRejectMalformedToken() {
        JwtService service = service(900_000L);

        assertThrows(UnauthorizedException.class, () -> service.parseAccessToken("not-a-jwt"));
    }
}
