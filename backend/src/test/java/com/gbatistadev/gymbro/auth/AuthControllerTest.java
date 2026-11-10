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
import com.jayway.jsonpath.JsonPath;
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
            userService, userRepository, refreshTokenRepository,
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
    @DisplayName("login returns 200 with bearer tokens in the body and no Set-Cookie")
    void shouldLoginAndReturnTokensInBody() throws Exception {
        User user = existingUser("password123");
        when(userRepository.findByEmail("joao@example.com")).thenReturn(Optional.of(user));

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(LOGIN_BODY))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.tokenType").value("Bearer"))
            .andExpect(jsonPath("$.expiresIn").value(900))
            .andExpect(jsonPath("$.accessToken").isNotEmpty())
            .andExpect(jsonPath("$.refreshToken").isNotEmpty())
            .andExpect(header().doesNotExist("Set-Cookie"))
            .andExpect(header().string("Cache-Control", "no-store"))
            .andReturn();

        String body = result.getResponse().getContentAsString();
        String accessToken = JsonPath.read(body, "$.accessToken");
        String refreshToken = JsonPath.read(body, "$.refreshToken");

        assertEquals(user.getId(), jwtService.parseAccessToken(accessToken),
            "access token deve autenticar como o usuário");
        assertEquals(3, accessToken.split("\\.").length, "access token deve ser um JWT");
        assertEquals(43, refreshToken.length(), "32 bytes em base64url sem padding");
        assertTrue(refreshToken.matches("[A-Za-z0-9_-]+"));
    }

    @Test
    @DisplayName("login never leaks the password hash")
    void shouldNotLeakPasswordHashOnLogin() throws Exception {
        User user = existingUser("password123");
        when(userRepository.findByEmail("joao@example.com")).thenReturn(Optional.of(user));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(LOGIN_BODY))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.passwordHash").doesNotExist());
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

    @Test
    @DisplayName("refresh returns a new parseable access token in the body and no Set-Cookie")
    void shouldRefreshAccessToken() throws Exception {
        User user = existingUser("password123");
        RefreshToken stored = new RefreshToken();
        stored.setTokenHash("a".repeat(64));
        stored.setExpiresAt(java.time.Instant.now().plusSeconds(60));
        stored.setUser(user);
        when(refreshTokenRepository.findValidByTokenHash(anyString(), any(java.time.Instant.class)))
            .thenReturn(Optional.of(stored));

        MvcResult result = mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"refreshToken":"raw-token"}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.tokenType").value("Bearer"))
            .andExpect(jsonPath("$.expiresIn").value(900))
            .andExpect(jsonPath("$.refreshToken").value("raw-token"))
            .andExpect(header().doesNotExist("Set-Cookie"))
            .andReturn();

        String accessToken = JsonPath.read(result.getResponse().getContentAsString(), "$.accessToken");
        assertEquals(user.getId(), jwtService.parseAccessToken(accessToken),
            "o access token devolvido deve autenticar como o usuário");
    }

    @Test
    @DisplayName("refresh without a body returns 401 ErrorResponse")
    void shouldRejectRefreshWithoutToken() throws Exception {
        mockMvc.perform(post("/api/auth/refresh"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.status").value(401))
            .andExpect(jsonPath("$.error").value("UNAUTHORIZED"))
            .andExpect(jsonPath("$.message").value("Invalid refresh token"))
            .andExpect(jsonPath("$.path").value("/api/auth/refresh"));
    }

    @Test
    @DisplayName("refresh with a blank token returns the same 401")
    void shouldRejectBlankRefreshToken() throws Exception {
        mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"refreshToken":"  "}
                    """))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.message").value("Invalid refresh token"));
    }

    @Test
    @DisplayName("refresh with unknown or expired token returns the same 401")
    void shouldRejectUnknownOrExpiredRefreshToken() throws Exception {
        when(refreshTokenRepository.findValidByTokenHash(anyString(), any(java.time.Instant.class)))
            .thenReturn(Optional.empty());

        mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"refreshToken":"expired-token"}
                    """))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.message").value("Invalid refresh token"));
    }

    private User existingUser(String rawPassword) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setName("João Silva");
        user.setEmail("joao@example.com");
        user.setPasswordHash(encoder.encode(rawPassword));
        return user;
    }
}
