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
import jakarta.servlet.http.Cookie;
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

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthController test class")
class AuthControllerTest {

    // >= 32 bytes, exigido para HS256
    private static final String SECRET = "test-secret-0123456789012345678901234567890123456789";
    private static final String REGISTER_BODY = """
        {"name":"João Silva","username":"joao.silva","email":"joao@example.com","password":"password123"}
        """;
    private static final String LOGIN_BODY = """
        {"identifier":"joao@example.com","password":"password123"}
        """;
    private static final String LOGIN_BODY_USERNAME = """
        {"identifier":"JOAO.SILVA","password":"password123"}
        """;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    private MockMvc mockMvc;
    private JwtService jwtService;
    private LoginRateLimiter loginRateLimiter;
    private final PasswordEncoder encoder = new BCryptPasswordEncoder();

    @BeforeEach
    void setUp() {
        UserMapper mapper = new UserMapperImpl();
        JwtProperties properties = new JwtProperties(SECRET, 900_000L, 15_552_000_000L);
        UserService userService = new UserService(userRepository, refreshTokenRepository, mapper, encoder);
        jwtService = new JwtService(properties);
        AuthService authService = new AuthService(
            userService, userRepository, refreshTokenRepository,
            encoder, jwtService, properties, mapper);
        AuthCookies authCookies = new AuthCookies(properties, false, "Strict", "");
        loginRateLimiter = new LoginRateLimiter(5, java.time.Duration.ofMinutes(15));
        mockMvc = MockMvcBuilders.standaloneSetup(
                new AuthController(authService, authCookies, loginRateLimiter))
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();
    }

    @Test
    @DisplayName("register returns 201, sets session cookies and never leaks tokens or password hash")
    void shouldRegisterUser() throws Exception {
        User user = existingUser("password123");
        when(userRepository.existsByEmail("joao@example.com")).thenReturn(false);
        when(userRepository.findByEmail("joao@example.com")).thenReturn(Optional.of(user));

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(REGISTER_BODY))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.name").value("João Silva"))
            .andExpect(jsonPath("$.email").value("joao@example.com"))
            .andExpect(jsonPath("$.username").value("joao.silva"))
            .andExpect(jsonPath("$.passwordHash").doesNotExist())
            .andExpect(jsonPath("$.accessToken").doesNotExist())
            .andExpect(jsonPath("$.refreshToken").doesNotExist())
            .andExpect(header().string("Cache-Control", "no-store"))
            .andReturn();

        assertSessionCookies(result);
    }

    @Test
    @DisplayName("login returns 200, sets HttpOnly cookies and keeps tokens out of the body")
    void shouldLoginAndSetSessionCookies() throws Exception {
        User user = existingUser("password123");
        when(userRepository.findByIdentifier("joao@example.com")).thenReturn(Optional.of(user));

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(LOGIN_BODY))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("joao@example.com"))
            .andExpect(jsonPath("$.accessToken").doesNotExist())
            .andExpect(jsonPath("$.refreshToken").doesNotExist())
            .andExpect(header().string("Cache-Control", "no-store"))
            .andReturn();

        String accessToken = assertSessionCookies(result);
        String refreshToken = cookieValue(result, AuthCookies.REFRESH);

        assertEquals(user.getId(), jwtService.parseAccessToken(accessToken),
            "access token do cookie deve autenticar como o usuário");
        assertEquals(3, accessToken.split("\\.").length, "access token deve ser um JWT");
        assertEquals(43, refreshToken.length(), "32 bytes em base64url sem padding");
        assertTrue(refreshToken.matches("[A-Za-z0-9_-]+"));
    }

    @Test
    @DisplayName("login never leaks the password hash")
    void shouldNotLeakPasswordHashOnLogin() throws Exception {
        User user = existingUser("password123");
        when(userRepository.findByIdentifier("joao@example.com")).thenReturn(Optional.of(user));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(LOGIN_BODY))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    @DisplayName("login with username in any case returns 200")
    void shouldLoginWithUsername() throws Exception {
        User user = existingUser("password123");
        when(userRepository.findByIdentifier("JOAO.SILVA")).thenReturn(Optional.of(user));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(LOGIN_BODY_USERNAME))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("joao@example.com"))
            .andExpect(jsonPath("$.username").value("joao.silva"));
    }

    @Test
    @DisplayName("login with wrong password returns 401 ErrorResponse")
    void shouldRejectWrongPassword() throws Exception {
        User user = existingUser("password123");
        when(userRepository.findByIdentifier("joao@example.com")).thenReturn(Optional.of(user));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"identifier":"joao@example.com","password":"wrong-password"}
                    """))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.status").value(401))
            .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"))
            .andExpect(jsonPath("$.message").value("Invalid credentials"))
            .andExpect(jsonPath("$.path").value("/api/auth/login"));
    }

    @Test
    @DisplayName("login with unknown identifier returns the same 401 (no user enumeration)")
    void shouldRejectUnknownIdentifier() throws Exception {
        when(userRepository.findByIdentifier("ghost")).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"identifier":"ghost","password":"password123"}
                    """))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.message").value("Invalid credentials"));
    }

    @Test
    @DisplayName("login with unknown email returns the same 401 (no user enumeration)")
    void shouldRejectUnknownEmail() throws Exception {
        when(userRepository.findByIdentifier("ghost@example.com")).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"identifier":"ghost@example.com","password":"password123"}
                    """))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.message").value("Invalid credentials"));
    }

    @Test
    @DisplayName("refresh reads the cookie and sets a new access cookie without exposing tokens")
    void shouldRefreshAccessTokenFromCookie() throws Exception {
        User user = existingUser("password123");
        RefreshToken stored = new RefreshToken();
        stored.setTokenHash("a".repeat(64));
        stored.setExpiresAt(java.time.Instant.now().plusSeconds(60));
        stored.setUser(user);
        when(refreshTokenRepository.findValidByTokenHash(anyString(), any(java.time.Instant.class)))
            .thenReturn(Optional.of(stored));

        MvcResult result = mockMvc.perform(post("/api/auth/refresh")
                .cookie(new Cookie(AuthCookies.REFRESH, "raw-token")))
            .andExpect(status().isNoContent())
            .andExpect(header().string("Cache-Control", "no-store"))
            .andReturn();

        String accessToken = cookieValue(result, AuthCookies.ACCESS);
        assertEquals(user.getId(), jwtService.parseAccessToken(accessToken),
            "o access token do cookie deve autenticar como o usuário");
    }

    @Test
    @DisplayName("refresh without the cookie returns 401 ErrorResponse")
    void shouldRejectRefreshWithoutToken() throws Exception {
        mockMvc.perform(post("/api/auth/refresh"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.status").value(401))
            .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"))
            .andExpect(jsonPath("$.message").value("Invalid refresh token"))
            .andExpect(jsonPath("$.path").value("/api/auth/refresh"));
    }

    @Test
    @DisplayName("refresh with a blank cookie returns the same 401")
    void shouldRejectBlankRefreshToken() throws Exception {
        mockMvc.perform(post("/api/auth/refresh")
                .cookie(new Cookie(AuthCookies.REFRESH, "")))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.message").value("Invalid refresh token"));
    }

    @Test
    @DisplayName("refresh with unknown or expired cookie token returns the same 401")
    void shouldRejectUnknownOrExpiredRefreshToken() throws Exception {
        when(refreshTokenRepository.findValidByTokenHash(anyString(), any(java.time.Instant.class)))
            .thenReturn(Optional.empty());

        mockMvc.perform(post("/api/auth/refresh")
                .cookie(new Cookie(AuthCookies.REFRESH, "expired-token")))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.message").value("Invalid refresh token"));
    }

    @Test
    @DisplayName("validation failures return VALIDATION_FAILED with one entry per field")
    void shouldReturnFieldErrorsOnValidationFailure() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name":"","username":"valid_one","email":"not-an-email","password":"short"}
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
            .andExpect(jsonPath("$.errors[*].field",
                containsInAnyOrder("name", "email", "password")))
            .andExpect(jsonPath("$.errors[*].message").isNotEmpty());
    }

    @Test
    @DisplayName("register without a username is rejected as a validation failure")
    void shouldRejectMissingUsername() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name":"João Silva","email":"joao@example.com","password":"password123"}
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
            .andExpect(jsonPath("$.errors[*].field", containsInAnyOrder("username")))
            .andExpect(jsonPath("$.errors[0].message").value("Username is required"));
    }

    @Test
    @DisplayName("an invalid username is reported on its own field")
    void shouldRejectInvalidUsername() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name":"João Silva","username":"a b!","email":"joao@example.com","password":"password123"}
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
            .andExpect(jsonPath("$.errors[*].field", containsInAnyOrder("username")))
            .andExpect(jsonPath("$.errors[0].message")
                .value("Use de 3 a 30 caracteres: letras, números, ponto ou sublinhado."));
    }

    @Test
    @DisplayName("a successful error response always carries an errors array (empty when unused)")
    void shouldAlwaysIncludeErrorsArray() throws Exception {
        when(userRepository.findByIdentifier("ghost@example.com")).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"identifier":"ghost@example.com","password":"password123"}
                    """))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.errors").isArray())
            .andExpect(jsonPath("$.errors").isEmpty());
    }

    @Test
    @DisplayName("the sixth failed login from the same origin returns 429 with Retry-After")
    void shouldRateLimitRepeatedFailures() throws Exception {
        User user = existingUser("password123");
        when(userRepository.findByIdentifier("joao@example.com")).thenReturn(Optional.of(user));
        String wrong = """
            {"identifier":"joao@example.com","password":"wrong-password"}
            """;

        for (int attempt = 1; attempt <= 5; attempt++) {
            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(wrong))
                .andExpect(status().isUnauthorized());
        }

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(wrong))
            .andExpect(status().isTooManyRequests())
            .andExpect(header().exists("Retry-After"))
            .andExpect(jsonPath("$.code").value("TOO_MANY_ATTEMPTS"));
    }

    @Test
    @DisplayName("a successful login clears the failure counter")
    void shouldResetCounterOnSuccess() throws Exception {
        User user = existingUser("password123");
        when(userRepository.findByIdentifier("joao@example.com")).thenReturn(Optional.of(user));
        String wrong = """
            {"identifier":"joao@example.com","password":"wrong-password"}
            """;

        for (int attempt = 1; attempt <= 4; attempt++) {
            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(wrong))
                .andExpect(status().isUnauthorized());
        }

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(LOGIN_BODY))
            .andExpect(status().isOk());

        // com o contador zerado, mais uma falha ainda é 401 e não 429
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(wrong))
            .andExpect(status().isUnauthorized());
    }

    private String assertSessionCookies(MvcResult result) {
        String accessHeader = setCookieHeader(result, AuthCookies.ACCESS);
        String refreshHeader = setCookieHeader(result, AuthCookies.REFRESH);

        assertTrue(accessHeader.contains("HttpOnly"), accessHeader);
        assertTrue(accessHeader.contains("SameSite=Strict"), accessHeader);
        assertTrue(accessHeader.contains("Path=/api"), accessHeader);
        assertTrue(refreshHeader.contains("HttpOnly"), refreshHeader);
        assertTrue(refreshHeader.contains("SameSite=Strict"), refreshHeader);
        assertTrue(refreshHeader.contains("Path=/api/auth"), refreshHeader);

        return cookieValue(result, AuthCookies.ACCESS);
    }

    private String setCookieHeader(MvcResult result, String name) {
        return result.getResponse().getHeaders("Set-Cookie").stream()
            .filter(header -> header.startsWith(name + "="))
            .findFirst()
            .orElseThrow(() -> new AssertionError("cookie ausente: " + name));
    }

    private String cookieValue(MvcResult result, String name) {
        String header = setCookieHeader(result, name);
        int separator = header.indexOf(';');
        int end = separator < 0 ? header.length() : separator;
        return header.substring((name + "=").length(), end);
    }

    private User existingUser(String rawPassword) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setName("João Silva");
        user.setEmail("joao@example.com");
        user.setUsername("joao.silva");
        user.setPasswordHash(encoder.encode(rawPassword));
        return user;
    }
}
