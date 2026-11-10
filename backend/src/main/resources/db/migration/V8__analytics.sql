-- T5: analytics needs timezone-correct weeks/months (D7).
ALTER TABLE workout_session
    ALTER COLUMN started_at TYPE timestamptz USING started_at AT TIME ZONE 'UTC',
    ALTER COLUMN ended_at   TYPE timestamptz USING ended_at   AT TIME ZONE 'UTC';

ALTER TABLE bioimpedance
    ALTER COLUMN measured_at TYPE timestamptz USING measured_at AT TIME ZONE 'UTC';
