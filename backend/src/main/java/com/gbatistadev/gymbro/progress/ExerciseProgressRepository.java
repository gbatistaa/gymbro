package com.gbatistadev.gymbro.progress;

import com.gbatistadev.gymbro.progress.dto.ExerciseProgressSummaryDto;
import com.gbatistadev.gymbro.progress.dto.ExerciseSeriesDto.SeriesPointDto;
import com.gbatistadev.gymbro.progress.dto.ExerciseSeriesDto.SeriesSummaryDto;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

/**
 * Consultas do painel de Progresso. Ficam em SQL com {@link NamedParameterJdbcTemplate} porque o
 * {@code ORDER BY} muda com o pedido e os períodos usam {@code date_trunc} no fuso do usuário.
 * Só contam séries de sessões finalizadas (é o que "fiz o treino" grava).
 */
@Repository
@RequiredArgsConstructor
public class ExerciseProgressRepository {
    private static final String E1RM =
        "CASE WHEN l.reps = 1 THEN l.weight ELSE l.weight * (1 + l.reps / 30.0) END";

    private static final String PROGRESS_CTE = """
        WITH progress AS (
            SELECT l.exercise_id,
                   COUNT(DISTINCT s.id)      AS session_count,
                   COUNT(*)                  AS total_sets,
                   SUM(l.weight * l.reps)    AS total_volume,
                   MAX(l.weight)             AS best_weight,
                   MAX(%s)                   AS best_e1rm,
                   MAX(s.started_at)         AS last_performed_at
            FROM workout_log l
            JOIN workout_session s ON s.id = l.workout_session_id
            WHERE s.user_id = :userId AND s.status = 'FINISHED'
            GROUP BY l.exercise_id
        )
        """.formatted(E1RM);

    private static final String PROGRESS_FILTER = """
        FROM progress p
        JOIN exercises e ON e.id = p.exercise_id
        LEFT JOIN user_pinned_exercises pin ON pin.user_id = :userId AND pin.exercise_id = e.id
        WHERE (:search = '' OR e.name ILIKE :pattern ESCAPE '\\')
          AND (:muscle = '' OR lower(trim(e.primary_muscle)) = lower(trim(:muscle)))
        """;

    private static final String SERIES_FILTER = """
        FROM workout_log l
        JOIN workout_session s ON s.id = l.workout_session_id
        WHERE s.user_id = :userId AND s.status = 'FINISHED'
          AND l.exercise_id = :exerciseId
          AND s.started_at >= :from AND s.started_at < :to
        """;

    private final NamedParameterJdbcTemplate jdbc;

    public List<ExerciseProgressSummaryDto> findSummaries(UUID userId, ExerciseProgressFilter filter) {
        String sql = PROGRESS_CTE + """
            SELECT e.id, e.name, e.primary_muscle,
                   p.session_count, p.total_sets, p.total_volume,
                   p.best_weight, p.best_e1rm, p.last_performed_at,
                   (pin.id IS NOT NULL) AS is_pinned
            """ + PROGRESS_FILTER + """
            ORDER BY %s %s NULLS LAST, lower(e.name) ASC, e.id ASC
            LIMIT :limit OFFSET :offset
            """.formatted(filter.sort().sqlExpression(), filter.direction().name());

        MapSqlParameterSource params = summaryParams(userId, filter)
            .addValue("limit", filter.size())
            .addValue("offset", (long) filter.page() * filter.size());

        return jdbc.query(sql, params, (row, index) -> new ExerciseProgressSummaryDto(
            row.getObject("id", UUID.class),
            row.getString("name"),
            row.getString("primary_muscle"),
            row.getLong("session_count"),
            row.getLong("total_sets"),
            row.getDouble("total_volume"),
            row.getDouble("best_weight"),
            row.getDouble("best_e1rm"),
            instant(row, "last_performed_at"),
            row.getBoolean("is_pinned")));
    }

    public long countSummaries(UUID userId, ExerciseProgressFilter filter) {
        String sql = PROGRESS_CTE + "SELECT COUNT(*) " + PROGRESS_FILTER;
        Long count = jdbc.queryForObject(sql, summaryParams(userId, filter), Long.class);
        return count == null ? 0 : count;
    }

    public List<SeriesPointDto> findSeries(
        UUID userId, UUID exerciseId, Instant from, Instant to, SeriesBucket bucket, ZoneId zone
    ) {
        String sql = """
            SELECT date_trunc(CAST(:unit AS text), s.started_at AT TIME ZONE CAST(:zone AS text))
                       AT TIME ZONE CAST(:zone AS text) AS period_start,
                   COUNT(DISTINCT s.id)   AS sessions,
                   COUNT(*)               AS sets,
                   SUM(l.reps)            AS reps,
                   MAX(l.weight)          AS max_weight,
                   SUM(l.weight * l.reps) AS volume,
                   MAX(%s)                AS best_e1rm
            """.formatted(E1RM) + SERIES_FILTER + """
            GROUP BY 1
            ORDER BY 1
            """;

        MapSqlParameterSource params = seriesParams(userId, exerciseId, from, to)
            .addValue("unit", bucket.dateTruncUnit())
            .addValue("zone", zone.getId());

        return jdbc.query(sql, params, (row, index) -> new SeriesPointDto(
            instant(row, "period_start"),
            row.getLong("sessions"),
            row.getLong("sets"),
            row.getLong("reps"),
            row.getDouble("max_weight"),
            row.getDouble("volume"),
            row.getDouble("best_e1rm")));
    }

    public SeriesSummaryDto summarizeSeries(UUID userId, UUID exerciseId, Instant from, Instant to) {
        String sql = """
            SELECT COUNT(DISTINCT s.id)                AS session_count,
                   COUNT(*)                            AS total_sets,
                   COALESCE(SUM(l.reps), 0)            AS total_reps,
                   COALESCE(SUM(l.weight * l.reps), 0) AS total_volume,
                   MAX(l.weight)                       AS best_weight,
                   MAX(%s)                             AS best_e1rm,
                   MAX(s.started_at)                   AS last_performed_at
            """.formatted(E1RM) + SERIES_FILTER;

        return jdbc.queryForObject(sql, seriesParams(userId, exerciseId, from, to), (row, index) ->
            new SeriesSummaryDto(
                row.getLong("session_count"),
                row.getLong("total_sets"),
                row.getLong("total_reps"),
                row.getDouble("total_volume"),
                row.getObject("best_weight", Double.class),
                row.getObject("best_e1rm", Double.class),
                instant(row, "last_performed_at")));
    }

    private static MapSqlParameterSource summaryParams(UUID userId, ExerciseProgressFilter filter) {
        return new MapSqlParameterSource()
            .addValue("userId", userId)
            .addValue("search", filter.search())
            .addValue("pattern", "%" + escapeLike(filter.search()) + "%")
            .addValue("muscle", filter.muscle());
    }

    private static MapSqlParameterSource seriesParams(UUID userId, UUID exerciseId, Instant from, Instant to) {
        return new MapSqlParameterSource()
            .addValue("userId", userId)
            .addValue("exerciseId", exerciseId)
            .addValue("from", OffsetDateTime.ofInstant(from, ZoneOffset.UTC))
            .addValue("to", OffsetDateTime.ofInstant(to, ZoneOffset.UTC));
    }

    /** O texto buscado é literal: {@code %} e {@code _} não viram curingas. */
    private static String escapeLike(String value) {
        return value
            .replace("\\", "\\\\")
            .replace("%", "\\%")
            .replace("_", "\\_");
    }

    private static Instant instant(ResultSet row, String column) throws SQLException {
        OffsetDateTime value = row.getObject(column, OffsetDateTime.class);
        return value == null ? null : value.toInstant();
    }
}
