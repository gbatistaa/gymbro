-- author: jacob
-- T18: exclusão de conta. Toda tabela abaixo pertence ao usuário, então a cascata no banco é a
-- única forma de apagar sem deixar órfãos e sem uma sequência de DELETEs que alguém vai esquecer
-- de atualizar quando surgir uma tabela nova. Decisão e perdas registradas em
-- docs/adr/0002-exclusao-de-conta.md.
ALTER TABLE refresh_tokens          DROP CONSTRAINT FK_REFRESH_TOKENS_ON_USER;
ALTER TABLE refresh_tokens          ADD CONSTRAINT FK_REFRESH_TOKENS_ON_USER          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;
ALTER TABLE playlists               DROP CONSTRAINT fk_playlists_user;
ALTER TABLE playlists               ADD CONSTRAINT fk_playlists_user                  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;
ALTER TABLE workout_session         DROP CONSTRAINT fk_sessions_user;
ALTER TABLE workout_session         ADD CONSTRAINT fk_sessions_user                   FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;
ALTER TABLE bioimpedance            DROP CONSTRAINT fk_bioimpedance_user;
ALTER TABLE bioimpedance            ADD CONSTRAINT fk_bioimpedance_user               FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;
ALTER TABLE exercises               DROP CONSTRAINT fk_exercises_user;
ALTER TABLE exercises               ADD CONSTRAINT fk_exercises_user                  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;
ALTER TABLE bioimpedance_import_job DROP CONSTRAINT fk_import_job_user;
ALTER TABLE bioimpedance_import_job ADD CONSTRAINT fk_import_job_user                 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

-- filhos: precisam cair junto para a cascata de users alcançar a folha
ALTER TABLE playlist_exercise       DROP CONSTRAINT FK_PLAYLIST_EXERCISE_ON_PLAYLIST;
ALTER TABLE playlist_exercise       ADD CONSTRAINT FK_PLAYLIST_EXERCISE_ON_PLAYLIST   FOREIGN KEY (playlist_id) REFERENCES playlists (id) ON DELETE CASCADE;
ALTER TABLE playlist_exercise       DROP CONSTRAINT FK_PLAYLIST_EXERCISE_ON_EXERCISE;
ALTER TABLE playlist_exercise       ADD CONSTRAINT FK_PLAYLIST_EXERCISE_ON_EXERCISE   FOREIGN KEY (exercise_id) REFERENCES exercises (id) ON DELETE CASCADE;
ALTER TABLE workout_session         DROP CONSTRAINT FK_WORKOUT_SESSION_ON_PLAYLIST;
ALTER TABLE workout_session         ADD CONSTRAINT FK_WORKOUT_SESSION_ON_PLAYLIST     FOREIGN KEY (playlist_id) REFERENCES playlists (id) ON DELETE CASCADE;
ALTER TABLE workout_log             DROP CONSTRAINT FK_WORKOUT_LOG_ON_WORKOUT_SESSION;
ALTER TABLE workout_log             ADD CONSTRAINT FK_WORKOUT_LOG_ON_WORKOUT_SESSION  FOREIGN KEY (workout_session_id) REFERENCES workout_session (id) ON DELETE CASCADE;
ALTER TABLE workout_log             DROP CONSTRAINT FK_WORKOUT_LOG_ON_EXERCISE;
ALTER TABLE workout_log             ADD CONSTRAINT FK_WORKOUT_LOG_ON_EXERCISE         FOREIGN KEY (exercise_id) REFERENCES exercises (id) ON DELETE CASCADE;
ALTER TABLE bioimpedance_log        DROP CONSTRAINT FK_BIOIMPEDANCE_LOG_ON_BIOIMPEDANCE;
ALTER TABLE bioimpedance_log        ADD CONSTRAINT FK_BIOIMPEDANCE_LOG_ON_BIOIMPEDANCE FOREIGN KEY (bioimpedance_id) REFERENCES bioimpedance (id) ON DELETE CASCADE;
