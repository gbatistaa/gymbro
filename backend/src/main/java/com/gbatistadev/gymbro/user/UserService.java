package com.gbatistadev.gymbro.user;

import com.gbatistadev.gymbro.common.aspect.Logging;
import com.gbatistadev.gymbro.errors.exceptions.InvalidCurrentPasswordException;
import com.gbatistadev.gymbro.errors.exceptions.NotFoundException;
import com.gbatistadev.gymbro.errors.exceptions.ResourceAlreadyExistsException;
import com.gbatistadev.gymbro.errors.exceptions.UnauthorizedException;
import com.gbatistadev.gymbro.user.dto.CreateUserDto;
import com.gbatistadev.gymbro.user.dto.UpdatePasswordRequest;
import com.gbatistadev.gymbro.user.dto.UpdateUserDto;
import com.gbatistadev.gymbro.user.dto.UserDto;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository repository;
    private final RefreshTokenRepository refreshTokens;
    private final UserMapper mapper;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public UserDto create(CreateUserDto dto) {
        if (repository.existsByEmail(dto.email())) {
            throw new ResourceAlreadyExistsException("A user with that email already exists");
        }

        // o formato é insensível a caixa; o banco guarda só minúsculas
        String username = dto.username().trim().toLowerCase(Locale.ROOT);
        if (repository.existsByUsernameIgnoreCase(username)) {
            throw new ResourceAlreadyExistsException(
                "A user with that username already exists", "username");
        }

        User user = mapper.toEntity(dto);
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(dto.password()));
        repository.save(user);

        return mapper.toDto(user);
    }

    @Transactional
    @Logging(action = "UPDATE")
    public UserDto update(UpdateUserDto dto, UUID id) {
        User user = repository.findById(id)
            .orElseThrow(() -> new NotFoundException("User not found: " + id));

        mapper.updateEntity(dto, user);

        return mapper.toDto(user);
    }

    /**
     * Troca a senha e derruba todas as sessões: quem trocou precisa entrar de novo em cada
     * dispositivo. Senha atual incorreta é 400, nunca 401, para o interceptor do PWA não tratar
     * como sessão expirada.
     */
    @Transactional
    @Logging(action = "UPDATE_PASSWORD")
    public void changePassword(UpdatePasswordRequest dto, UUID id) {
        User user = repository.findById(id)
            .orElseThrow(() -> new UnauthorizedException("Session is no longer valid"));

        if (!passwordEncoder.matches(dto.currentPassword(), user.getPasswordHash())) {
            throw new InvalidCurrentPasswordException();
        }

        user.setPasswordHash(passwordEncoder.encode(dto.newPassword()));
        refreshTokens.deleteByUserId(id);
    }

    /**
     * Apaga a conta e, por cascata no banco, tudo que pende dela (ver V11). Sem soft delete: o
     * histórico de treino é dado pessoal e some junto — decisão em docs/adr/0002.
     *
     * <p>Usuário já apagado responde 401, e não 404: o token apresentado aponta para uma identidade
     * que não existe mais, então a sessão é inválida.
     */
    @Transactional
    @Logging(action = "DELETE")
    public void deleteAccount(UUID id) {
        User user = repository.findById(id)
            .orElseThrow(() -> new UnauthorizedException("Session is no longer valid"));

        repository.delete(user);
    }
}
