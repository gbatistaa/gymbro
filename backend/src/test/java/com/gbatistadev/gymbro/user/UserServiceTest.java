package com.gbatistadev.gymbro.user;

import com.gbatistadev.gymbro.errors.exceptions.InvalidCurrentPasswordException;
import com.gbatistadev.gymbro.errors.exceptions.NotFoundException;
import com.gbatistadev.gymbro.errors.exceptions.ResourceAlreadyExistsException;
import com.gbatistadev.gymbro.user.dto.CreateUserDto;
import com.gbatistadev.gymbro.user.dto.UpdatePasswordRequest;
import com.gbatistadev.gymbro.user.dto.UpdateUserDto;
import com.gbatistadev.gymbro.user.dto.UserDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserService test class")
class UserServiceTest {

    @Mock
    private UserRepository repository;

    @Mock
    private RefreshTokenRepository refreshTokens;

    // mapper e encoder reais: o comportamento de update parcial e o hash da senha são o que se testa
    private final UserMapper mapper = new UserMapperImpl();
    private UserService service;

    @BeforeEach
    void setUp() {
        service = new UserService(repository, refreshTokens, mapper, new BCryptPasswordEncoder());
    }

    @Test
    @DisplayName("create assigns the default time zone")
    void shouldDefaultTimeZoneOnCreate() {
        CreateUserDto dto = new CreateUserDto("João Silva", "u" + UUID.randomUUID().toString().substring(0, 8), "joao@example.com", "password123");
        when(repository.existsByEmail("joao@example.com")).thenReturn(false);

        UserDto result = service.create(dto);

        assertEquals("America/Sao_Paulo", result.getTimezone());
    }

    @Test
    @DisplayName("create saves user with BCrypt hash")
    void shouldCreateUser_whenEmailIsNew() {
        CreateUserDto dto = new CreateUserDto("João Silva", "u" + UUID.randomUUID().toString().substring(0, 8), "joao@example.com", "password123");
        when(repository.existsByEmail("joao@example.com")).thenReturn(false);

        UserDto result = service.create(dto);

        assertEquals("João Silva", result.getName());
        assertEquals("joao@example.com", result.getEmail());

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(repository).save(captor.capture());
        assertTrue(captor.getValue().getPasswordHash().startsWith("$2"));
        assertNotEquals("password123", captor.getValue().getPasswordHash());
    }

    @Test
    @DisplayName("create rejects duplicated email")
    void shouldThrow_whenEmailAlreadyExists() {
        CreateUserDto dto = new CreateUserDto("João Silva", "u" + UUID.randomUUID().toString().substring(0, 8), "joao@example.com", "password123");
        when(repository.existsByEmail("joao@example.com")).thenReturn(true);

        assertThrows(ResourceAlreadyExistsException.class, () -> service.create(dto));
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("create stores the username in lowercase")
    void shouldNormalizeUsernameToLowercase() {
        CreateUserDto dto = new CreateUserDto("João Silva", "Joao.Silva", "joao@example.com", "password123");
        when(repository.existsByEmail("joao@example.com")).thenReturn(false);

        UserDto result = service.create(dto);

        assertEquals("joao.silva", result.getUsername());

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(repository).save(captor.capture());
        assertEquals("joao.silva", captor.getValue().getUsername());
    }

    @Test
    @DisplayName("create rejects duplicated username and points the conflict at the field")
    void shouldThrow_whenUsernameAlreadyExists() {
        CreateUserDto dto = new CreateUserDto("João Silva", "joao", "joao@example.com", "password123");
        when(repository.existsByEmail("joao@example.com")).thenReturn(false);
        when(repository.existsByUsernameIgnoreCase("joao")).thenReturn(true);

        ResourceAlreadyExistsException exception = assertThrows(
            ResourceAlreadyExistsException.class, () -> service.create(dto));

        assertEquals("username", exception.getField());
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("update applies only non-null fields")
    void shouldPreserveFieldsNotSentOnPartialUpdate() {
        UUID id = UUID.randomUUID();
        User existing = new User();
        existing.setName("João Silva");
        existing.setEmail("joao@example.com");
        existing.setPasswordHash("$2a$hash");
        when(repository.findById(id)).thenReturn(Optional.of(existing));

        UserDto result = service.update(new UpdateUserDto(null, "novo@example.com", null), id);

        assertEquals("João Silva", result.getName());
        assertEquals("novo@example.com", result.getEmail());
    }

    @Test
    @DisplayName("update throws when user does not exist")
    void shouldThrowNotFound_whenUserIdDoesNotExist() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class,
            () -> service.update(new UpdateUserDto("Novo Nome", null, null), id));
    }

    @Test
    @DisplayName("changePassword stores the new hash and revokes every session")
    void shouldChangePasswordAndRevokeSessions() {
        User existing = passwordUser("old-password-123");
        when(repository.findById(existing.getId())).thenReturn(Optional.of(existing));

        service.changePassword(
            new UpdatePasswordRequest("old-password-123", "new-password-456"), existing.getId());

        assertTrue(new BCryptPasswordEncoder().matches("new-password-456", existing.getPasswordHash()));
        verify(refreshTokens).deleteByUserId(existing.getId());
    }

    @Test
    @DisplayName("changePassword with the wrong current password changes nothing")
    void shouldRejectPasswordChange_whenCurrentPasswordIsWrong() {
        User existing = passwordUser("old-password-123");
        String hashBefore = existing.getPasswordHash();
        when(repository.findById(existing.getId())).thenReturn(Optional.of(existing));

        InvalidCurrentPasswordException exception = assertThrows(
            InvalidCurrentPasswordException.class,
            () -> service.changePassword(
                new UpdatePasswordRequest("not-the-password", "new-password-456"), existing.getId()));

        assertEquals("INVALID_CURRENT_PASSWORD", exception.getCode());
        assertEquals(hashBefore, existing.getPasswordHash());
        verify(refreshTokens, never()).deleteByUserId(any());
    }

    private User passwordUser(String rawPassword) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setName("João Silva");
        user.setEmail("joao@example.com");
        user.setUsername("joao.silva");
        user.setPasswordHash(new BCryptPasswordEncoder().encode(rawPassword));
        return user;
    }
}
