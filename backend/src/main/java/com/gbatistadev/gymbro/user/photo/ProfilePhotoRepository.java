package com.gbatistadev.gymbro.user.photo;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ProfilePhotoRepository extends JpaRepository<ProfilePhoto, UUID> {
    Optional<ProfilePhoto> findByUserId(UUID userId);
}
