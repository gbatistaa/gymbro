package com.gbatistadev.gymbro.config.jwt;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "spring.jwt")
public record JwtProperties(
        String secret,
        Long expirationMs
) {}
