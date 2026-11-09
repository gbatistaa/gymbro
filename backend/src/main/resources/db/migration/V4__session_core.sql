-- T2: workout execution core.
ALTER TABLE workout_session
    ADD COLUMN status   VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS',
    ADD COLUMN notes    VARCHAR(1000),
    ADD COLUMN version  BIGINT      NOT NULL DEFAULT 0,
    ALTER COLUMN ended_at    DROP NOT NULL,
    ALTER COLUMN playlist_id DROP NOT NULL;

ALTER TABLE workout_session
    ADD CONSTRAINT ck_session_status CHECK (status IN ('IN_PROGRESS', 'FINISHED', 'ABANDONED')),
    ADD CONSTRAINT ck_session_dates  CHECK (ended_at IS NULL OR ended_at >= started_at);

-- one open session per user; the DB, not the service, wins the race
CREATE UNIQUE INDEX ux_session_open ON workout_session (user_id) WHERE status = 'IN_PROGRESS';

ALTER TABLE workout_log
    ADD COLUMN client_log_id UUID NOT NULL,
    ADD COLUMN rpe           INTEGER,
    ADD COLUMN notes         VARCHAR(500);

ALTER TABLE workout_log
    ADD CONSTRAINT ck_log_rpe CHECK (rpe IS NULL OR rpe BETWEEN 1 AND 10),
    ADD CONSTRAINT uk_log_client UNIQUE (workout_session_id, client_log_id),
    ADD CONSTRAINT uk_log_set    UNIQUE (workout_session_id, exercise_id, set_number);
