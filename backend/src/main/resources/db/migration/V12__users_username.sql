-- author: jacob
-- Task 1: username único, para o login aceitar e-mail ou username no mesmo campo.
--
-- Expand/contract: a coluna nasce anulável, é preenchida a partir da parte local do e-mail e só
-- então recebe NOT NULL e unicidade. Contas existentes nunca ficam sem username no meio do caminho.
ALTER TABLE users ADD COLUMN username VARCHAR(30);

DO $$
DECLARE
    account   RECORD;
    base      TEXT;
    candidate TEXT;
    suffix    INT;
BEGIN
    -- shortcut: backfill linha a linha; upgrade = lotes com throttle quando users passar de ~1M linhas
    FOR account IN
        SELECT id, email FROM users WHERE username IS NULL ORDER BY created_at, id
    LOOP
        -- parte local do e-mail, sem o que não cabe no formato do username
        base := lower(split_part(account.email, '@', 1));
        base := regexp_replace(base, '[^a-z0-9_.]', '.', 'g');
        base := regexp_replace(base, '\.{2,}', '.', 'g');
        base := btrim(base, '.');
        base := rtrim(left(base, 30), '.');

        -- curto demais (ou vazio) não é username válido: usa o id, que é único por definição
        IF length(base) < 3 THEN
            base := 'user_' || substr(replace(account.id::text, '-', ''), 1, 6);
        END IF;

        -- colisão com nome já existente ou já gerado: sufixo numérico que caiba em 30 caracteres
        candidate := base;
        suffix := 1;
        WHILE EXISTS (
            SELECT 1 FROM users u WHERE lower(u.username) = candidate AND u.id <> account.id
        ) LOOP
            suffix := suffix + 1;
            candidate := rtrim(left(base, 30 - length(suffix::text)), '.') || suffix::text;
        END LOOP;

        UPDATE users SET username = candidate WHERE id = account.id;
    END LOOP;
END $$;

ALTER TABLE users ALTER COLUMN username SET NOT NULL;

-- DEFAULT temporário: enquanto o código ainda não conhece o campo (Task 2), um insert antigo
-- continua válido em vez de estourar NOT NULL. A Task 2 remove este DEFAULT.
-- Fica depois do backfill de propósito: com DEFAULT, `WHERE username IS NULL` não encontraria linha.
ALTER TABLE users ALTER COLUMN username
    SET DEFAULT 'user_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);

CREATE UNIQUE INDEX uk_users_username ON users (lower(username));

ALTER TABLE users ADD CONSTRAINT ck_users_username_format
    CHECK (char_length(username) >= 3
       AND username ~ '^[a-z0-9_]([a-z0-9_.]*[a-z0-9_])?$');
