-- T4: bioimpedance ingestion.
ALTER TABLE bioimpedance
    ADD COLUMN body_weight_kg          DOUBLE PRECISION,
    ADD COLUMN height_cm               DOUBLE PRECISION,
    ADD COLUMN skeletal_muscle_mass_kg DOUBLE PRECISION,
    ADD COLUMN source                  VARCHAR(30) NOT NULL DEFAULT 'MANUAL',
    ADD COLUMN source_file_hash        VARCHAR(64),
    ADD COLUMN deleted_at              timestamptz,
    ALTER COLUMN visceral_fat     DROP NOT NULL,
    ALTER COLUMN water_percentage DROP NOT NULL;

ALTER TABLE bioimpedance
    ADD CONSTRAINT ck_body_fat CHECK (body_fat_percentage BETWEEN 0 AND 70),
    ADD CONSTRAINT ck_water    CHECK (water_percentage IS NULL OR water_percentage BETWEEN 0 AND 100),
    ADD CONSTRAINT ck_visceral CHECK (visceral_fat IS NULL OR visceral_fat BETWEEN 0 AND 60),
    ADD CONSTRAINT ck_weight   CHECK (body_weight_kg IS NULL OR body_weight_kg BETWEEN 20 AND 400),
    ADD CONSTRAINT ck_height   CHECK (height_cm IS NULL OR height_cm BETWEEN 100 AND 250);

-- one measurement per timestamp and one import per file; soft-deleted rows free the slot
CREATE UNIQUE INDEX ux_bio_user_measured
    ON bioimpedance (user_id, measured_at) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX ux_bio_user_hash
    ON bioimpedance (user_id, source_file_hash)
    WHERE source_file_hash IS NOT NULL AND deleted_at IS NULL;
