-- The measurement keeps the name of the file it came from; the job points to the measurement it
-- created, so an import is "open" (listed for review) until it is confirmed or discarded.
ALTER TABLE bioimpedance
    ADD COLUMN source_file_name VARCHAR(255);

ALTER TABLE bioimpedance_import_job
    ADD COLUMN bioimpedance_id UUID,
    ADD CONSTRAINT fk_import_job_bioimpedance
        FOREIGN KEY (bioimpedance_id) REFERENCES bioimpedance (id) ON DELETE SET NULL;

-- jobs confirmed before this migration: link them through the file hash
UPDATE bioimpedance_import_job job
SET bioimpedance_id = measurement.id
FROM bioimpedance measurement
WHERE job.status = 'DONE'
  AND measurement.user_id = job.user_id
  AND measurement.source_file_hash = job.source_file_hash
  AND measurement.deleted_at IS NULL;

UPDATE bioimpedance measurement
SET source_file_name = job.source_file_name
FROM bioimpedance_import_job job
WHERE job.bioimpedance_id = measurement.id;

CREATE INDEX ix_import_job_user_open
    ON bioimpedance_import_job (user_id, created_at DESC)
    WHERE bioimpedance_id IS NULL;
