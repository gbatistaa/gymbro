package com.gbatistadev.gymbro.user.photo;

import com.gbatistadev.gymbro.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/** Foto de perfil de um usuário (no máximo uma). O arquivo mora no bucket; aqui fica só a chave. */
@Getter
@Setter
@Entity
@NoArgsConstructor
@Table(name = "user_profile_photos")
public class ProfilePhoto extends BaseEntity {
    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @Column(name = "object_key", nullable = false)
    private String objectKey;

    @Column(name = "content_type", nullable = false, length = 20)
    private String contentType;

    @Column(name = "size_bytes", nullable = false)
    private int sizeBytes;
}
