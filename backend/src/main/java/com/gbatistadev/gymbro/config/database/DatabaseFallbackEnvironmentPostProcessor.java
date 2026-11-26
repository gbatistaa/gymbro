package com.gbatistadev.gymbro.config.database;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Map;
import java.util.Properties;

import org.apache.commons.logging.Log;
import org.springframework.boot.EnvironmentPostProcessor;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.logging.DeferredLogFactory;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

/**
 * Testa a conexão primária antes de o Spring criar o DataSource e, se ela falhar,
 * aponta o datasource para o banco local configurado em {@code app.datasource-fallback}.
 */
public class DatabaseFallbackEnvironmentPostProcessor implements EnvironmentPostProcessor {

    static final String PROPERTY_SOURCE_NAME = "databaseFallback";

    private static final String DATASOURCE_URL = "spring.datasource.url";
    private static final String DATASOURCE_USERNAME = "spring.datasource.username";
    private static final String DATASOURCE_PASSWORD = "spring.datasource.password";
    private static final String FALLBACK_URL = "app.datasource-fallback.url";
    private static final String FALLBACK_USERNAME = "app.datasource-fallback.username";
    private static final String FALLBACK_PASSWORD = "app.datasource-fallback.password";
    private static final int CONNECT_TIMEOUT_SECONDS = 5;

    private final Log log;

    public DatabaseFallbackEnvironmentPostProcessor(DeferredLogFactory logFactory) {
        this.log = logFactory.getLog(DatabaseFallbackEnvironmentPostProcessor.class);
    }

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String primaryUrl = environment.getRequiredProperty(DATASOURCE_URL);
        String primaryUsername = environment.getRequiredProperty(DATASOURCE_USERNAME);
        String primaryPassword = environment.getProperty(DATASOURCE_PASSWORD, "");

        if (canConnect(primaryUrl, primaryUsername, primaryPassword)) {
            return;
        }

        String fallbackUrl = environment.getRequiredProperty(FALLBACK_URL);
        String fallbackUsername = environment.getRequiredProperty(FALLBACK_USERNAME);
        String fallbackPassword = environment.getProperty(FALLBACK_PASSWORD, "");

        log.warn("Conexão primária com o banco falhou; usando o banco local de fallback: " + fallbackUrl);

        environment.getPropertySources().addFirst(new MapPropertySource(
                PROPERTY_SOURCE_NAME,
                Map.of(
                        DATASOURCE_URL, fallbackUrl,
                        DATASOURCE_USERNAME, fallbackUsername,
                        DATASOURCE_PASSWORD, fallbackPassword)));
    }

    private boolean canConnect(String url, String username, String password) {
        Properties connectionProperties = new Properties();
        connectionProperties.setProperty("user", username);
        connectionProperties.setProperty("password", password);
        connectionProperties.setProperty("connectTimeout", String.valueOf(CONNECT_TIMEOUT_SECONDS));

        try (Connection connection = DriverManager.getConnection(url, connectionProperties)) {
            return connection.isValid(CONNECT_TIMEOUT_SECONDS);
        } catch (SQLException exception) {
            log.warn("Não foi possível conectar ao banco primário: " + exception.getMessage());
            return false;
        }
    }
}
