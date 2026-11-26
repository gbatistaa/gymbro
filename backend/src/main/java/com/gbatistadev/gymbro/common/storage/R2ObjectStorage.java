package com.gbatistadev.gymbro.common.storage;

import com.gbatistadev.gymbro.config.storage.R2Properties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

@Component
@RequiredArgsConstructor
public class R2ObjectStorage implements ObjectStorage {
    // conteúdo de uma chave nunca muda (ver ObjectStorage), então o navegador pode guardar para sempre
    private static final String CACHE_CONTROL = "private, max-age=31536000, immutable";

    private final S3Client client;
    private final S3Presigner presigner;
    private final R2Properties properties;

    @Override
    public void put(String key, byte[] content, String contentType) {
        PutObjectRequest request = PutObjectRequest.builder()
            .bucket(properties.bucket())
            .key(key)
            .contentType(contentType)
            .cacheControl(CACHE_CONTROL)
            .build();

        client.putObject(request, RequestBody.fromBytes(content));
    }

    @Override
    public void delete(String key) {
        client.deleteObject(DeleteObjectRequest.builder()
            .bucket(properties.bucket())
            .key(key)
            .build());
    }

    @Override
    public String readUrl(String key) {
        GetObjectPresignRequest request = GetObjectPresignRequest.builder()
            .signatureDuration(properties.readUrlTtl())
            .getObjectRequest(object -> object.bucket(properties.bucket()).key(key))
            .build();

        return presigner.presignGetObject(request).url().toString();
    }
}
