-- T3: routines and catalog.
ALTER TABLE playlists
    ADD COLUMN description VARCHAR(500),
    ADD COLUMN archived_at timestamptz;

ALTER TABLE playlist_exercise
    ADD COLUMN target_reps_min INTEGER,
    ADD COLUMN target_reps_max INTEGER,
    ADD COLUMN rest_seconds    INTEGER,
    ADD COLUMN note            VARCHAR(500);

ALTER TABLE playlist_exercise
    ADD CONSTRAINT ck_reps_range CHECK (
        target_reps_min IS NULL OR target_reps_max IS NULL OR target_reps_min <= target_reps_max),
    ADD CONSTRAINT ck_rest CHECK (rest_seconds IS NULL OR rest_seconds BETWEEN 0 AND 600);

-- deferred so a reorder can update every row in one transaction
ALTER TABLE playlist_exercise
    ADD CONSTRAINT uk_playlist_order UNIQUE (playlist_id, order_index)
    DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE exercises
    ALTER COLUMN secondary_muscle DROP NOT NULL,
    ADD COLUMN equipment    VARCHAR(50),
    ADD COLUMN increment_kg DOUBLE PRECISION DEFAULT 2.5,
    ADD COLUMN is_archived  BOOLEAN NOT NULL DEFAULT FALSE;
