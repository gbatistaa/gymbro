-- author: jacob
-- Fichas deixam de ser arquivadas: passam a ser excluídas. Excluir uma ficha não pode apagar o
-- histórico de treinos já feitos (volume, PRs e progresso), então a sessão só perde o vínculo.
-- As marcações "fiz o treino" da ficha saem junto, por cascata (V13).

ALTER TABLE workout_session DROP CONSTRAINT FK_WORKOUT_SESSION_ON_PLAYLIST;
ALTER TABLE workout_session ADD CONSTRAINT FK_WORKOUT_SESSION_ON_PLAYLIST
    FOREIGN KEY (playlist_id) REFERENCES playlists (id) ON DELETE SET NULL;

ALTER TABLE playlists DROP COLUMN archived_at;
