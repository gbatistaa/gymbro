package com.gbatistadev.gymbro.user;

import com.gbatistadev.gymbro.errors.exceptions.NotFoundException;
import com.gbatistadev.gymbro.user.dto.UpdatePasswordRequest;
import com.gbatistadev.gymbro.user.dto.UpdateUserDto;
import com.gbatistadev.gymbro.user.dto.UserDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/users/me")
@RequiredArgsConstructor
public class UserController {
    private final UserRepository userRepository;
    private final UserService userService;

    @GetMapping
    public UserSummaryProjection me(@AuthenticationPrincipal UUID userId) {
        return userRepository.findSummaryById(userId)
            .orElseThrow(() -> new NotFoundException("User not found: " + userId));
    }

    @PutMapping
    public UserDto update(@Valid @RequestBody UpdateUserDto dto, @AuthenticationPrincipal UUID userId) {
        return userService.update(dto, userId);
    }

    @PutMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(
        @Valid @RequestBody UpdatePasswordRequest dto,
        @AuthenticationPrincipal UUID userId
    ) {
        userService.changePassword(dto, userId);
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal UUID userId) {
        userService.deleteAccount(userId);
    }
}
