package com.gbatistadev.gymbro.progress;

/**
 * Colunas aceitas para ordenar a lista de progresso. A expressão SQL é fixa por constante: o
 * cliente só escolhe a constante, nunca o texto que vai para o {@code ORDER BY}.
 */
public enum ExerciseProgressSort {
    LAST_PERFORMED_AT("p.last_performed_at"),
    NAME("lower(e.name)"),
    SESSION_COUNT("p.session_count"),
    TOTAL_SETS("p.total_sets"),
    TOTAL_VOLUME("p.total_volume"),
    BEST_WEIGHT("p.best_weight"),
    BEST_E1RM("p.best_e1rm");

    private final String sqlExpression;

    ExerciseProgressSort(String sqlExpression) {
        this.sqlExpression = sqlExpression;
    }

    String sqlExpression() {
        return sqlExpression;
    }
}
