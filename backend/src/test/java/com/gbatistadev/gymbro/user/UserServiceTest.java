package com.gbatistadev.gymbro.user;

import com.gbatistadev.gymbro.errors.exceptions.NotFoundException;
import com.gbatistadev.gymbro.errors.exceptions.ResourceAlreadyExistsException;
import com.gbatistadev.gymbro.user.dto.CreateUserDto;
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

    // mapper e encoder reais: o comportamento de update parcial e o hash da senha são o que se testa
    private final UserMapper mapper = new UserMapperImpl();
    private UserService service;

    @BeforeEach
    void setUp() {
        service = new UserService(repository, mapper, new BCryptPasswordEncoder());
    }

    @Test
    @DisplayName("create assigns the default time zone")
    void shouldDefaultTimeZoneOnCreate() {
        CreateUserDto dto = new CreateUserDto("João Silva", "joao@example.com", "password123");
        when(repository.existsByEmail("joao@example.com")).thenReturn(false);

        UserDto result = service.create(dto);

        assertEquals("America/Sao_Paulo", result.getTimezone());
    }

    @Test
    @DisplayName("create saves user with BCrypt hash")
    void shouldCreateUser_whenEmailIsNew() {
        CreateUserDto dto = new CreateUserDto("João Silva", "joao@example.com", "password123");
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
        CreateUserDto dto = new CreateUserDto("João Silva", "joao@example.com", "password123");
        when(repository.existsByEmail("joao@example.com")).thenReturn(true);

        assertThrows(ResourceAlreadyExistsException.class, () -> service.create(dto));
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
}
