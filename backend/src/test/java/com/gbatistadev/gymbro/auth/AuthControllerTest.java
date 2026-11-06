package com.gbatistadev.gymbro.auth;

import com.gbatistadev.gymbro.config.jwt.JwtProperties;
import com.gbatistadev.gymbro.config.jwt.JwtService;
import com.gbatistadev.gymbro.errors.GlobalExceptionHandler;
import com.gbatistadev.gymbro.user.RefreshToken;
import com.gbatistadev.gymbro.user.RefreshTokenRepository;
import com.gbatistadev.gymbro.user.User;
import com.gbatistadev.gymbro.user.UserMapper;
import com.gbatistadev.gymbro.user.UserMapperImpl;
import com.gbatistadev.gymbro.user.UserRepository;
import com.gbatistadev.gymbro.user.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthController test class")
class AuthControllerTest {

    // >= 32 bytes, exigido para HS256
    private static final String SECRET = "test-secret-0123456789012345678901234567890123456789";
    private static final String REGISTER_BODY = """
        {"name":"João Silva","email":"joao@example.com","password":"password123"}
        """;
    private static final String LOGIN_BODY = """
        {"email":"joao@example.com","password":"password123"}
        """;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    private MockMvc mockMvc;
    private JwtService jwtService;
    private final PasswordEncoder encoder = new BCryptPasswordEncoder();

    @BeforeEach
    void setUp() {
        UserMapper mapper = new UserMapperImpl();
        JwtProperties properties = new JwtProperties(SECRET, 900_000L, 15_552_000_000L);
        UserService userService = new UserService(userRepository, mapper, encoder);
        jwtService = new JwtService(properties);
        AuthService authService = new AuthService(
            userService, mapper, userRepository, refreshTokenRepository,
            encoder, jwtService, properties);
        mockMvc = MockMvcBuilders.standaloneSetup(new AuthController(authService))
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();
    }

    @Test
    @DisplayName("register returns 201 with user data and no password hash")
    void shouldRegisterUser() throws Exception {
        when(userRepository.existsByEmail("joao@example.com")).thenReturn(false);

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(REGISTER_BODY))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.name").value("João Silva"))
            .andExpect(jsonPath("$.email").value("joao@example.com"))
            .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    @DisplayName("login returns 200 with HttpOnly access and refresh cookies")
    void shouldLoginAndSetCookies() throws Exception {
        User user = existingUser("password123");
        when(userRepository.findByEmail("joao@example.com")).thenReturn(Optional.of(user));
        when(refreshTokenRepository.findByUserId(any())).thenReturn(Optional.empty());

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(LOGIN_BODY))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("joao@example.com"))
            .andReturn();

        List<String> setCookies = result.getResponse().getHeaders("Set-Cookie");
        assertEquals(2, setCookies.size());

        String access = setCookies.stream()
            .filter(h -> h.startsWith("access_token=")).findFirst().orElseThrow();
        String accessValue = access.substring("access_token=".length(), access.indexOf(';'));
        assertTrue(access.contains("Max-Age=900"), access);
        assertTrue(access.contains("Path=/;"), access);
        assertTrue(access.contains("HttpOnly"), access);
        assertTrue(access.contains("SameSite=Lax"), access);
        assertEquals(3, accessValue.split("\\.").length, "access token deve ser um JWT");

        String refresh = setCookies.stream()
            .filter(h -> h.startsWith("refresh_token=")).findFirst().orElseThrow();
        String refreshValue = refresh.substring("refresh_token=".length(), refresh.indexOf(';'));
        assertTrue(refresh.contains("Max-Age=15552000"), refresh);
        assertTrue(refresh.contains("Path=/api/auth;"), refresh);
        assertTrue(refresh.contains("HttpOnly"), refresh);
        assertTrue(refresh.contains("SameSite=Lax"), refresh);
        assertEquals(43, refreshValue.length(), "32 bytes em base64url sem padding");
        assertTrue(refreshValue.matches("[A-Za-z0-9_-]+"));
    }

    @Test
    @DisplayName("login with wrong password returns 401 ErrorResponse")
    void shouldRejectWrongPassword() throws Exception {
        User user = existingUser("password123");
        when(userRepository.findByEmail("joao@example.com")).thenReturn(Optional.of(user));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"joao@example.com","password":"wrong-password"}
                    """))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.status").value(401))
            .andExpect(jsonPath("$.error").value("UNAUTHORIZED"))
            .andExpect(jsonPath("$.message").value("Invalid credentials"))
            .andExpect(jsonPath("$.path").value("/api/auth/login"));
    }

    @Test
    @DisplayName("login with unknown email returns the same 401 (no user enumeration)")
    void shouldRejectUnknownEmail() throws Exception {
        when(userRepository.findByEmail("ghost@example.com")).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"ghost@example.com","password":"password123"}
                    """))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.message").value("Invalid credentials"));
    }

    private User existingUser(String rawPassword) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setName("João Silva");
        user.setEmail("joao@example.com");
        user.setPasswordHash(encoder.encode(rawPassword));
        return user;
    }

    @Test
    @DisplayName("refresh issues a new parseable access cookie and user dto")
    void shouldRefreshAccessToken() throws Exception {
        User user = existingUser("password123");
        RefreshToken stored = new RefreshToken();
        stored.setTokenHash("a".repeat(64));
        stored.setExpiresAt(java.time.Instant.now().plusSeconds(60));
        stored.setUser(user);
        when(refreshTokenRepository.findValidByTokenHash(anyString(), any(java.time.Instant.class)))
            .thenReturn(Optional.of(stored));

        MvcResult result = mockMvc.perform(post("/api/auth/refresh")
                .cookie(new jakarta.servlet.http.Cookie("refresh_token", "raw-token")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("joao@example.com"))
            .andExpect(jsonPath("$.passwordHash").doesNotExist())
            .andReturn();

        String setCookie = result.getResponse().getHeader("Set-Cookie");
        assertNotNull(setCookie, "deve emitir novo access_token");
        assertTrue(setCookie.startsWith("access_token="), setCookie);
        assertTrue(setCookie.contains("HttpOnly"), setCookie);
        assertTrue(setCookie.contains("Path=/;"), setCookie);
        String jwt = setCookie.substring("access_token=".length(), setCookie.indexOf(';'));
        assertEquals(user.getId(), jwtService.parseAccessToken(jwt), "cookie deve autenticar como o usuário");
    }

    @Test
    @DisplayName("refresh without cookie returns 401 ErrorResponse")
    void shouldRejectRefreshWithoutCookie() throws Exception {
        mockMvc.perform(post("/api/auth/refresh"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.status").value(401))
            .andExpect(jsonPath("$.error").value("UNAUTHORIZED"))
            .andExpect(jsonPath("$.message").value("Invalid refresh token"))
            .andExpect(jsonPath("$.path").value("/api/auth/refresh"));
    }

    @Test
    @DisplayName("refresh with unknown or expired token returns the same 401")
    void shouldRejectUnknownOrExpiredRefreshToken() throws Exception {
        when(refreshTokenRepository.findValidByTokenHash(anyString(), any(java.time.Instant.class)))
            .thenReturn(Optional.empty());

        mockMvc.perform(post("/api/auth/refresh")
                .cookie(new jakarta.servlet.http.Cookie("refresh_token", "expired-token")))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.message").value("Invalid refresh token"));
    }
}
