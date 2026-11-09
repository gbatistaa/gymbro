-- T1: ownership. Every user-owned aggregate gets an owner.
-- Dev-only: these tables had no owner and no production data to backfill.
TRUNCATE TABLE workout_log, workout_session, playlist_exercise, playlists, bioimpedance, bioimpedance_log CASCADE;

ALTER TABLE playlists        ADD COLUMN user_id UUID;
ALTER TABLE workout_session  ADD COLUMN user_id UUID;
ALTER TABLE bioimpedance     ADD COLUMN user_id UUID;

ALTER TABLE playlists        ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE workout_session  ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE bioimpedance     ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE playlists        ADD CONSTRAINT fk_playlists_user    FOREIGN KEY (user_id) REFERENCES users (id);
ALTER TABLE workout_session  ADD CONSTRAINT fk_sessions_user     FOREIGN KEY (user_id) REFERENCES users (id);
ALTER TABLE bioimpedance     ADD CONSTRAINT fk_bioimpedance_user FOREIGN KEY (user_id) REFERENCES users (id);

CREATE INDEX ix_playlists_user        ON playlists (user_id);
CREATE INDEX ix_sessions_user_started ON workout_session (user_id, started_at DESC);
CREATE INDEX ix_bio_user_measured     ON bioimpedance (user_id, measured_at DESC);
CREATE INDEX ix_workout_log_session   ON workout_log (workout_session_id);
CREATE INDEX ix_workout_log_exercise  ON workout_log (exercise_id);

-- Catalog: NULL user_id = global (read-only), non-NULL = custom exercise.
-- shortcut: dedup is case/whitespace-insensitive only; accent-insensitive needs unaccent/pg_trgm.
ALTER TABLE exercises ADD COLUMN user_id UUID;
ALTER TABLE exercises ADD CONSTRAINT fk_exercises_user FOREIGN KEY (user_id) REFERENCES users (id);
CREATE INDEX ix_exercises_user ON exercises (user_id);

CREATE UNIQUE INDEX ux_exercises_global_name
    ON exercises (lower(trim(name))) WHERE user_id IS NULL;
CREATE UNIQUE INDEX ux_exercises_user_name
    ON exercises (user_id, lower(trim(name))) WHERE user_id IS NOT NULL;
