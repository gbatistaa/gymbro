package com.gbatistadev.gymbro.user.photo;

import com.gbatistadev.gymbro.common.aspect.Logging;
import com.gbatistadev.gymbro.common.storage.ObjectStorage;
import com.gbatistadev.gymbro.user.photo.dto.ProfilePhotoDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.Optional;
import java.util.UUID;

/**
 * Foto de perfil: o arquivo vai para o bucket e o banco guarda a relação com o usuário.
 *
 * <p>Ordem das escritas: o objeto novo sobe antes da transação (sem segurar conexão durante o
 * upload) e o antigo só sai do bucket depois do commit. Se o banco falhar, o objeto novo é apagado;
 * se a limpeza do bucket falhar, sobra um arquivo órfão — nunca uma linha apontando para o nada.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProfilePhotoService {
    private final ProfilePhotoRepository repository;
    private final ObjectStorage storage;
    private final TransactionTemplate transactions;

    @Transactional(readOnly = true)
    public Optional<ProfilePhotoDto> find(UUID userId) {
        return repository.findByUserId(userId).map(this::toDto);
    }

    /** Cria a foto na primeira vez e a substitui nas seguintes. */
    @Logging(action = "REPLACE_PROFILE_PHOTO")
    public ProfilePhotoDto replace(UUID userId, MultipartFile file) {
        ProfilePhotoUpload upload = ProfilePhotoUpload.from(file);
        String objectKey = newObjectKey(userId, upload.format());

        storage.put(objectKey, upload.content(), upload.format().mimeType());
        try {
            return transactions.execute(status -> save(userId, objectKey, upload));
        } catch (RuntimeException e) {
            deleteQuietly(objectKey);
            throw e;
        }
    }

    /** Apaga a relação e o arquivo. Sem foto, não faz nada: remover é idempotente. */
    @Transactional
    @Logging(action = "REMOVE_PROFILE_PHOTO")
    public void remove(UUID userId) {
        repository.findByUserId(userId).ifPresent(photo -> {
            repository.delete(photo);
            deleteAfterCommit(photo.getObjectKey());
        });
    }

    private ProfilePhotoDto save(UUID userId, String objectKey, ProfilePhotoUpload upload) {
        ProfilePhoto photo = repository.findByUserId(userId).orElseGet(() -> newPhoto(userId));
        if (photo.getObjectKey() != null) {
            deleteAfterCommit(photo.getObjectKey());
        }

        photo.setObjectKey(objectKey);
        photo.setContentType(upload.format().mimeType());
        photo.setSizeBytes(upload.sizeBytes());
        repository.save(photo);

        return toDto(photo);
    }

    private ProfilePhoto newPhoto(UUID userId) {
        ProfilePhoto photo = new ProfilePhoto();
        photo.setUserId(userId);
        return photo;
    }

    // chave nova a cada envio: o conteúdo de uma chave nunca muda e o cache do navegador não envelhece
    private String newObjectKey(UUID userId, ProfilePhotoFormat format) {
        return "profile-photos/%s/%s.%s".formatted(userId, UUID.randomUUID(), format.extension());
    }

    private void deleteAfterCommit(String objectKey) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                deleteQuietly(objectKey);
            }
        });
    }

    private void deleteQuietly(String objectKey) {
        try {
            storage.delete(objectKey);
        } catch (RuntimeException e) {
            log.warn("Could not delete profile photo object {}; it is now orphaned", objectKey, e);
        }
    }

    private ProfilePhotoDto toDto(ProfilePhoto photo) {
        return new ProfilePhotoDto(
            storage.readUrl(photo.getObjectKey()),
            photo.getContentType(),
            photo.getSizeBytes());
    }
}
