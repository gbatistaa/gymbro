package com.gbatistadev.gymbro.bioimpedance.parser;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "bioimpedance.parser")
public record BioimpedanceParserProperties(
    String baseUrl,
    Duration timeout,
    String token
) {}
