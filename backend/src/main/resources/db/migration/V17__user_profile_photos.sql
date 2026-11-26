-- Foto de perfil: no máximo uma por usuário. O arquivo fica no bucket (Cloudflare R2); o banco
-- guarda só a chave do objeto. Trocar a foto atualiza a linha; remover apaga a linha.
CREATE TABLE user_profile_photos (
    id           UUID                     NOT NULL,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at   TIMESTAMP WITH TIME ZONE,
    user_id      UUID                     NOT NULL,
    object_key   VARCHAR(255)             NOT NULL,
    content_type VARCHAR(20)              NOT NULL,
    size_bytes   INTEGER                  NOT NULL,
    CONSTRAINT pk_user_profile_photos PRIMARY KEY (id),
    CONSTRAINT uk_user_profile_photos_user UNIQUE (user_id),
    CONSTRAINT uk_user_profile_photos_object_key UNIQUE (object_key),
    CONSTRAINT fk_user_profile_photos_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT ck_user_profile_photos_content_type
        CHECK (content_type IN ('image/png', 'image/jpeg', 'image/gif', 'image/webp')),
    -- 1 MB, o mesmo limite validado na API e no PWA
    CONSTRAINT ck_user_profile_photos_size CHECK (size_bytes BETWEEN 1 AND 1048576)
);
