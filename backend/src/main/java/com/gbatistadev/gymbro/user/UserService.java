package com.gbatistadev.gymbro.user;

import com.gbatistadev.gymbro.common.aspect.Logging;
import com.gbatistadev.gymbro.errors.exceptions.NotFoundException;
import com.gbatistadev.gymbro.errors.exceptions.ResourceAlreadyExistsException;
import com.gbatistadev.gymbro.user.dto.CreateUserDto;
import com.gbatistadev.gymbro.user.dto.UpdateUserDto;
import com.gbatistadev.gymbro.user.dto.UserDto;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class UserService {
    private final UserRepository repository;
    private final UserMapper mapper;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository repository, UserMapper mapper, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.mapper = mapper;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UserDto create(CreateUserDto dto) {
        if (repository.existsByEmail(dto.email())) {
            throw new ResourceAlreadyExistsException("A user with that email already exists");
        }

        User user = mapper.toEntity(dto);
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
}
