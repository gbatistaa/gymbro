-- author: jacob
-- Exercícios fixados no painel de Progresso: até 4 por usuário, numa ordem escolhida por ele.
-- Fixar de novo substitui a lista inteira. Excluir o usuário ou o exercício solta o vínculo.
CREATE TABLE user_pinned_exercises (
    id          UUID                     NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at  TIMESTAMP WITH TIME ZONE,
    user_id     UUID                     NOT NULL,
    exercise_id UUID                     NOT NULL,
    position    INTEGER                  NOT NULL,
    CONSTRAINT pk_user_pinned_exercises PRIMARY KEY (id),
    CONSTRAINT uk_user_pinned_exercises_exercise UNIQUE (user_id, exercise_id),
    CONSTRAINT uk_user_pinned_exercises_position UNIQUE (user_id, position),
    CONSTRAINT fk_user_pinned_exercises_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_user_pinned_exercises_exercise
        FOREIGN KEY (exercise_id) REFERENCES exercises (id) ON DELETE CASCADE,
    CONSTRAINT ck_user_pinned_exercises_position CHECK (position BETWEEN 0 AND 3)
);
