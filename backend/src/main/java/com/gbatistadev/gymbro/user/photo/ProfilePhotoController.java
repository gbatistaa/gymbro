package com.gbatistadev.gymbro.user.photo;

import com.gbatistadev.gymbro.user.photo.dto.ProfilePhotoDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/users/me/photo")
@RequiredArgsConstructor
public class ProfilePhotoController {
    private final ProfilePhotoService service;

    /** {@code 204} quando o usuário não tem foto. */
    @GetMapping
    public ResponseEntity<ProfilePhotoDto> get(@AuthenticationPrincipal UUID userId) {
        return service.find(userId)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.noContent().build());
    }

    // opcional no binding para a falta do arquivo virar o 400 do domínio, e não erro do Spring
    @PutMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ProfilePhotoDto replace(
        @RequestPart(value = "file", required = false) MultipartFile file,
        @AuthenticationPrincipal UUID userId
    ) {
        return service.replace(userId, file);
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@AuthenticationPrincipal UUID userId) {
        service.remove(userId);
    }
}
