-- T4.5: async PDF extraction jobs (no broker; one row per upload).
CREATE TABLE bioimpedance_import_job (
    id               UUID                     NOT NULL,
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at       TIMESTAMP WITH TIME ZONE,
    user_id          UUID                     NOT NULL,
    status           VARCHAR(20)              NOT NULL,
    source_file_name VARCHAR(255)             NOT NULL,
    source_file_hash VARCHAR(64)              NOT NULL,
    result           JSONB,
    error            VARCHAR(1000),
    finished_at      TIMESTAMP WITH TIME ZONE,
    CONSTRAINT pk_bioimpedance_import_job PRIMARY KEY (id),
    CONSTRAINT fk_import_job_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT ck_import_job_status CHECK (status IN ('PENDING', 'PROCESSING', 'DONE', 'FAILED'))
);

CREATE INDEX ix_import_job_user_created ON bioimpedance_import_job (user_id, created_at DESC);
CREATE INDEX ix_import_job_user_hash ON bioimpedance_import_job (user_id, source_file_hash);
