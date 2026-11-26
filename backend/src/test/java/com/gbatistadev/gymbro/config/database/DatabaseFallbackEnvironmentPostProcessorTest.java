package com.gbatistadev.gymbro.config.database;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.logging.DeferredLogFactory;
import org.springframework.mock.env.MockEnvironment;

class DatabaseFallbackEnvironmentPostProcessorTest {

    private static final String UNREACHABLE_PRIMARY_URL = "jdbc:postgresql://127.0.0.1:1/unreachable";
    private static final String FALLBACK_URL = "jdbc:postgresql://localhost:5432/gymbro";
    private static final String FALLBACK_USERNAME = "postgres";

    @Test
    @DisplayName("Uses the local fallback database when the primary connection fails")
    void usesFallbackWhenPrimaryConnectionFails() {
        MockEnvironment environment = new MockEnvironment()
                .withProperty("spring.datasource.url", UNREACHABLE_PRIMARY_URL)
                .withProperty("spring.datasource.username", "primary-user")
                .withProperty("spring.datasource.password", "primary-password")
                .withProperty("app.datasource-fallback.url", FALLBACK_URL)
                .withProperty("app.datasource-fallback.username", FALLBACK_USERNAME)
                .withProperty("app.datasource-fallback.password", "fallback-password");

        DeferredLogFactory logFactory = supplier -> supplier.get();
        new DatabaseFallbackEnvironmentPostProcessor(logFactory)
                .postProcessEnvironment(environment, new SpringApplication());

        assertEquals(FALLBACK_URL, environment.getProperty("spring.datasource.url"));
        assertEquals(FALLBACK_USERNAME, environment.getProperty("spring.datasource.username"));
    }
}
