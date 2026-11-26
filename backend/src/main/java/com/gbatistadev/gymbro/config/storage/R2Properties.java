package com.gbatistadev.gymbro.config.storage;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.net.URI;
import java.time.Duration;

@ConfigurationProperties(prefix = "storage.r2")
public record R2Properties(
    URI endpoint,
    String accessKeyId,
    String secretAccessKey,
    String bucket,
    Duration readUrlTtl
) {}
