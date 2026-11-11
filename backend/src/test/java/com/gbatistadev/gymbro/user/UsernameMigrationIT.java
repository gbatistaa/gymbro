package com.gbatistadev.gymbro.user;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationVersion;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * V12 precisa adicionar {@code users.username} sem quebrar contas existentes: a coluna nasce
 * anulável, é preenchida a partir da parte local do e-mail e só então recebe unicidade.
 *
 * <p>Roda o Flyway até a V11, insere contas "legadas" e migra o resto, que é o único jeito de
 * exercitar o backfill — num banco novo não existe linha para preencher.
 */
class UsernameMigrationIT {

    private static final PostgreSQLContainer POSTGRES =
        new PostgreSQLContainer(DockerImageName.parse("postgres:latest"));

    private static final String USERNAME_PATTERN =
        "^[a-z0-9_](?:[a-z0-9_.]*[a-z0-9_])?$";

    @BeforeAll
    static void startContainer() {
        POSTGRES.start();
    }

    @AfterAll
    static void stopContainer() {
        POSTGRES.stop();
    }

    @BeforeEach
    void resetSchema() throws SQLException {
        try (Connection connection = connect(); Statement statement = connection.createStatement()) {
            statement.execute("DROP SCHEMA public CASCADE");
            statement.execute("CREATE SCHEMA public");
        }
    }

    @Test
    @DisplayName("backfills usernames from the email local part and resolves collisions")
    void backfillsUsernames() throws SQLException {
        migrateTo("11");
        insertLegacyUsers();
        migrateToLatest();

        Map<String, String> usernames = usernamesByEmail();

        assertThat(usernames.get("joao.silva@x.com")).isEqualTo("joao.silva");
        assertThat(usernames.get("joao.silva@y.com")).isEqualTo("joao.silva2");
        assertThat(usernames.get("JOAO.SILVA@z.com")).isEqualTo("joao.silva3");
        assertThat(usernames.get("maria+treino@x.com")).isEqualTo("maria.treino");
        assertThat(usernames.get("joao.silva2@x.com"))
            .as("nome gerado por colisão anterior também precisa de sufixo")
            .isEqualTo("joao.silva22");
        assertThat(usernames.get("a@x.com")).matches("^user_[0-9a-f]{6}$");
        assertThat(usernames.get("--..--@x.com")).matches("^user_[0-9a-f]{6}$");
        assertThat(usernames.get("averylonglocalpartthatexceedsthirtychars@x.com"))
            .hasSizeLessThanOrEqualTo(30)
            .doesNotEndWith(".");
    }

    @Test
    @DisplayName("keeps every username valid, non-null and unique regardless of case")
    void enforcesFormatAndUniqueness() throws SQLException {
        migrateTo("11");
        insertLegacyUsers();
        migrateToLatest();

        Map<String, String> usernames = usernamesByEmail();

        assertThat(usernames).hasSize(8).doesNotContainValue(null);
        assertThat(usernames.values()).allMatch(name -> name.matches(USERNAME_PATTERN));
        assertThat(usernames.values()).allMatch(name -> name.length() >= 3 && name.length() <= 30);
        assertThat(usernames.values()).doesNotHaveDuplicates();

        assertThat(isUsernameNullable())
            .as("NOT NULL aplicado depois do backfill")
            .isFalse();
        assertThat(uniqueIndexDefinition())
            .as("unicidade insensível a caixa")
            .contains("UNIQUE INDEX", "lower", "username");

        assertThatThrownBy(() -> insertUser("dup@x.com", "joao.silva"))
            .as("o mesmo username não pode existir duas vezes")
            .isInstanceOf(SQLException.class)
            .hasMessageContaining("uk_users_username");

        assertThatThrownBy(() -> insertUser("case@x.com", "JOAO.SILVA"))
            .as("o CHECK exige minúsculas, que é o que torna a unicidade insensível a caixa")
            .isInstanceOf(SQLException.class)
            .hasMessageContaining("ck_users_username_format");
    }

    private void migrateTo(String version) {
        Flyway.configure()
            .dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())
            .target(MigrationVersion.fromVersion(version))
            .load()
            .migrate();
    }

    private void migrateToLatest() {
        Flyway.configure()
            .dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())
            .target(MigrationVersion.LATEST)
            .load()
            .migrate();
    }

    private Connection connect() throws SQLException {
        return DriverManager.getConnection(
            POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword());
    }

    /** Contas anteriores à V12: o insert não conhece a coluna {@code username}. */
    private void insertLegacyUsers() throws SQLException {
        insertLegacyUser("joao.silva@x.com");
        insertLegacyUser("joao.silva@y.com");
        insertLegacyUser("JOAO.SILVA@z.com");
        insertLegacyUser("a@x.com");
        insertLegacyUser("maria+treino@x.com");
        insertLegacyUser("--..--@x.com");
        insertLegacyUser("joao.silva2@x.com");
        insertLegacyUser("averylonglocalpartthatexceedsthirtychars@x.com");
    }

    private void insertLegacyUser(String email) throws SQLException {
        execute("""
            INSERT INTO users (id, created_at, name, email, password_hash, timezone)
            VALUES (gen_random_uuid(), now(), 'Teste', '%s', 'hash', 'America/Sao_Paulo')
            """.formatted(email));
    }

    private void insertUser(String email, String username) throws SQLException {
        execute("""
            INSERT INTO users (id, created_at, name, email, password_hash, timezone, username)
            VALUES (gen_random_uuid(), now(), 'Teste', '%s', 'hash', 'America/Sao_Paulo', '%s')
            """.formatted(email, username));
    }

    private void execute(String sql) throws SQLException {
        try (Connection connection = connect(); Statement statement = connection.createStatement()) {
            statement.execute(sql);
        }
    }

    private Map<String, String> usernamesByEmail() throws SQLException {
        Map<String, String> result = new LinkedHashMap<>();
        try (Connection connection = connect();
             Statement statement = connection.createStatement();
             ResultSet rows = statement.executeQuery(
                 "SELECT email, username FROM users ORDER BY created_at, email")) {
            while (rows.next()) {
                result.put(rows.getString("email"), rows.getString("username"));
            }
        }
        return result;
    }

    private boolean isUsernameNullable() throws SQLException {
        return singleBoolean("""
            SELECT is_nullable = 'YES' FROM information_schema.columns
            WHERE table_name = 'users' AND column_name = 'username'
            """);
    }

    private String uniqueIndexDefinition() throws SQLException {
        try (Connection connection = connect();
             Statement statement = connection.createStatement();
             ResultSet rows = statement.executeQuery(
                 "SELECT indexdef FROM pg_indexes WHERE indexname = 'uk_users_username'")) {
            return rows.next() ? rows.getString("indexdef") : "";
        }
    }

    private boolean singleBoolean(String sql) throws SQLException {
        try (Connection connection = connect();
             Statement statement = connection.createStatement();
             ResultSet rows = statement.executeQuery(sql)) {
            return rows.next() && rows.getBoolean(1);
        }
    }
}
