package com.gbatistadev.gymbro.bioimpedance.job;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "bioimpedance.import")
public record BioimpedanceImportProperties(Duration staleAfter) {}
