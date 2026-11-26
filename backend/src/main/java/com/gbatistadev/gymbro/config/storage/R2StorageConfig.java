package com.gbatistadev.gymbro.config.storage;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.checksums.RequestChecksumCalculation;
import software.amazon.awssdk.core.checksums.ResponseChecksumValidation;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

/**
 * Clientes S3 apontados para o Cloudflare R2. O R2 ignora região (usa {@code auto}) e, com endpoint
 * por conta, o bucket vai no caminho da URL.
 */
@Configuration
public class R2StorageConfig {
    private static final Region R2_REGION = Region.of("auto");

    @Bean
    S3Client r2Client(R2Properties properties) {
        return S3Client.builder()
            .endpointOverride(properties.endpoint())
            .region(R2_REGION)
            .credentialsProvider(credentials(properties))
            .serviceConfiguration(pathStyle())
            // checksums padrão do SDK desde a 2.30 não são aceitos por todo endpoint S3-compatível
            .requestChecksumCalculation(RequestChecksumCalculation.WHEN_REQUIRED)
            .responseChecksumValidation(ResponseChecksumValidation.WHEN_REQUIRED)
            .build();
    }

    @Bean
    S3Presigner r2Presigner(R2Properties properties) {
        return S3Presigner.builder()
            .endpointOverride(properties.endpoint())
            .region(R2_REGION)
            .credentialsProvider(credentials(properties))
            .serviceConfiguration(pathStyle())
            .build();
    }

    private static StaticCredentialsProvider credentials(R2Properties properties) {
        return StaticCredentialsProvider.create(
            AwsBasicCredentials.create(properties.accessKeyId(), properties.secretAccessKey()));
    }

    private static S3Configuration pathStyle() {
        return S3Configuration.builder().pathStyleAccessEnabled(true).build();
    }
}
