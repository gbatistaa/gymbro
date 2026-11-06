CREATE SEQUENCE IF NOT EXISTS revinfo_seq START WITH 1 INCREMENT BY 50;

CREATE TABLE bioimpedance
(
    id                  UUID                           NOT NULL,
    created_at          TIMESTAMP WITH TIME ZONE       NOT NULL,
    updated_at          TIMESTAMP WITH TIME ZONE,
    body_fat_percentage DOUBLE PRECISION               NOT NULL,
    muscle_mass_kg      DOUBLE PRECISION               NOT NULL,
    visceral_fat        DOUBLE PRECISION               NOT NULL,
    measured_at         TIMESTAMP(6) WITHOUT TIME ZONE NOT NULL,
    water_percentage    DOUBLE PRECISION               NOT NULL,
    CONSTRAINT pk_bioimpedance PRIMARY KEY (id)
);

CREATE TABLE bioimpedance_log
(
    id              UUID                     NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE,
    action_type     VARCHAR(255)             NOT NULL,
    old_data        JSONB,
    new_data        JSONB,
    bioimpedance_id UUID                     NOT NULL,
    CONSTRAINT pk_bioimpedance_log PRIMARY KEY (id)
);

CREATE TABLE exercises
(
    id               UUID                     NOT NULL,
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at       TIMESTAMP WITH TIME ZONE,
    name             VARCHAR(255)             NOT NULL,
    primary_muscle   VARCHAR(255)             NOT NULL,
    secondary_muscle VARCHAR(255)             NOT NULL,
    CONSTRAINT pk_exercises PRIMARY KEY (id)
);

CREATE TABLE playlist_exercise
(
    id          UUID                     NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at  TIMESTAMP WITH TIME ZONE,
    order_index INTEGER                  NOT NULL,
    target_sets INTEGER                  NOT NULL,
    playlist_id UUID                     NOT NULL,
    exercise_id UUID                     NOT NULL,
    CONSTRAINT pk_playlist_exercise PRIMARY KEY (id)
);

CREATE TABLE playlists
(
    id         UUID                     NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE,
    name       VARCHAR(255)             NOT NULL,
    CONSTRAINT pk_playlists PRIMARY KEY (id)
);

CREATE TABLE revchanges
(
    rev        BIGINT NOT NULL,
    entityname VARCHAR(255)
);

CREATE TABLE revinfo
(
    rev      BIGINT NOT NULL,
    revtstmp BIGINT,
    CONSTRAINT pk_revinfo PRIMARY KEY (rev)
);

CREATE TABLE workout_log
(
    id                 UUID                     NOT NULL,
    created_at         TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at         TIMESTAMP WITH TIME ZONE,
    set_number         INTEGER                  NOT NULL,
    weight             DOUBLE PRECISION         NOT NULL,
    reps               INTEGER                  NOT NULL,
    is_pr              BOOLEAN                  NOT NULL,
    exercise_id        UUID                     NOT NULL,
    workout_session_id UUID                     NOT NULL,
    CONSTRAINT pk_workout_log PRIMARY KEY (id)
);

CREATE TABLE workout_session
(
    id           UUID                           NOT NULL,
    created_at   TIMESTAMP WITH TIME ZONE       NOT NULL,
    updated_at   TIMESTAMP WITH TIME ZONE,
    started_at   TIMESTAMP(6) WITHOUT TIME ZONE NOT NULL,
    ended_at     TIMESTAMP(6) WITHOUT TIME ZONE NOT NULL,
    total_volume DOUBLE PRECISION               NOT NULL,
    playlist_id  UUID                           NOT NULL,
    CONSTRAINT pk_workout_session PRIMARY KEY (id)
);

ALTER TABLE bioimpedance_log
    ADD CONSTRAINT FK_BIOIMPEDANCE_LOG_ON_BIOIMPEDANCE FOREIGN KEY (bioimpedance_id) REFERENCES bioimpedance (id);

ALTER TABLE playlist_exercise
    ADD CONSTRAINT FK_PLAYLIST_EXERCISE_ON_EXERCISE FOREIGN KEY (exercise_id) REFERENCES exercises (id);

ALTER TABLE playlist_exercise
    ADD CONSTRAINT FK_PLAYLIST_EXERCISE_ON_PLAYLIST FOREIGN KEY (playlist_id) REFERENCES playlists (id);

ALTER TABLE workout_log
    ADD CONSTRAINT FK_WORKOUT_LOG_ON_EXERCISE FOREIGN KEY (exercise_id) REFERENCES exercises (id);

ALTER TABLE workout_log
    ADD CONSTRAINT FK_WORKOUT_LOG_ON_WORKOUT_SESSION FOREIGN KEY (workout_session_id) REFERENCES workout_session (id);

ALTER TABLE workout_session
    ADD CONSTRAINT FK_WORKOUT_SESSION_ON_PLAYLIST FOREIGN KEY (playlist_id) REFERENCES playlists (id);

ALTER TABLE revchanges
    ADD CONSTRAINT fk_revchanges_on_default_tracking_modified_entities_changelog FOREIGN KEY (rev) REFERENCES revinfo (rev);