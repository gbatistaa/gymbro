-- author: jacob
-- Registro de "fiz o treino" por ficha. Não guarda início, fim nem duração: só o instante em que a
-- rotina foi marcada como feita, que alimenta a contagem de treinos e a última execução.
-- Apagar a conta ou a rotina leva os registros junto, como nas demais tabelas (ver V11).

CREATE TABLE workout_completion (
    id           UUID                     NOT NULL PRIMARY KEY,
    user_id      UUID                     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    playlist_id  UUID                     NOT NULL REFERENCES playlists (id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at   TIMESTAMP WITH TIME ZONE
);

CREATE INDEX ix_completion_user_completed ON workout_completion (user_id, completed_at DESC);
CREATE INDEX ix_completion_playlist ON workout_completion (playlist_id);
