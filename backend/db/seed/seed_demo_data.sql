-- author: jacob
--
-- Seed de demonstração: ~3 meses de treinos, fichas, exercícios, registros e bioimpedância
-- para UM usuário já existente. NÃO é migration (fica fora de db/migration, o Flyway não roda).
--
-- Uso (a partir de backend/, com as variáveis do .env carregadas):
--   PGPASSWORD=... PGSSLMODE=require psql -h <host> -p 6543 -U <user> -d postgres \
--     -v target_email="'voce@email.com'" -v days=90 -f db/seed/seed_demo_data.sql
--
-- Variáveis (opcionais):
--   target_email  e-mail do usuário dono dos dados     (padrão: gbatistadev@gmail.com)
--   days          janela de histórico, em dias         (padrão: 90)
--   dry_run=1     executa tudo, mostra o resumo e faz ROLLBACK
--
-- Idempotente: todo registro tem id determinístico (md5 de usuário + tipo + chave). Rodar de novo
-- apaga o que o seed criou antes e recria; nada do que o usuário criou à mão é tocado.

\set ON_ERROR_STOP on
\if :{?target_email}
\else
  \set target_email 'gbatistadev@gmail.com'
\endif
\if :{?days}
\else
  \set days 90
\endif

BEGIN;

-- ---------------------------------------------------------------------------------------------
-- Funções auxiliares (pg_temp). OR REPLACE + DROP no fim: o pooler do Supabase reaproveita a conexão
-- do servidor entre sessões, então objetos temporários podem sobreviver ao psql.
-- ---------------------------------------------------------------------------------------------

-- Id estável por (usuário, tipo, chave): permite limpar e recriar sem marcador visível nos dados.
CREATE OR REPLACE FUNCTION pg_temp.seed_uuid(kind text, key text) RETURNS uuid
    LANGUAGE sql STABLE AS
$$ SELECT md5('gymbro-seed|' || current_setting('seed.user_id') || '|' || kind || '|' || key)::uuid $$;

-- Inteiro pseudo-aleatório determinístico em [0, n): mesma chave, mesmo resultado.
CREATE OR REPLACE FUNCTION pg_temp.seed_rnd(key text, n int) RETURNS int
    LANGUAGE sql IMMUTABLE AS
$$ SELECT (('x' || substr(md5('rnd|' || key), 1, 7))::bit(28)::int) % n $$;

-- ---------------------------------------------------------------------------------------------
-- Usuário-alvo
-- ---------------------------------------------------------------------------------------------

CREATE TEMP TABLE seed_ctx ON COMMIT DROP AS
SELECT u.id                                                            AS user_id,
       u.timezone                                                      AS tz,
       (now() AT TIME ZONE u.timezone)::date                           AS today,
       (now() AT TIME ZONE u.timezone)::date - (:days::int - 1)        AS start_date,
       ((now() AT TIME ZONE u.timezone)::date - (:days::int - 1)) - DATE '2020-01-01' AS start_dayno
FROM users u
WHERE lower(u.email) = lower(:'target_email');

DO
$$
BEGIN
    IF (SELECT count(*) FROM seed_ctx) <> 1 THEN
        RAISE EXCEPTION 'Usuário não encontrado para o e-mail informado (target_email).';
    END IF;
END
$$;

SELECT set_config('seed.user_id', (SELECT user_id::text FROM seed_ctx), true);

-- ---------------------------------------------------------------------------------------------
-- Limpeza do que um seed anterior criou (ids determinísticos; cascatas cuidam dos filhos)
-- ---------------------------------------------------------------------------------------------

DELETE FROM workout_completion
WHERE user_id = (SELECT user_id FROM seed_ctx)
  AND id IN (SELECT pg_temp.seed_uuid('completion', n::text) FROM generate_series(0, 6000) n);

DELETE FROM workout_session
WHERE user_id = (SELECT user_id FROM seed_ctx)
  AND id IN (SELECT pg_temp.seed_uuid('session', n::text) FROM generate_series(0, 6000) n);

DELETE FROM user_pinned_exercises
WHERE user_id = (SELECT user_id FROM seed_ctx)
  AND id IN (SELECT pg_temp.seed_uuid('pin', n::text) FROM generate_series(0, 3) n);

DELETE FROM playlists
WHERE user_id = (SELECT user_id FROM seed_ctx)
  AND id IN (SELECT pg_temp.seed_uuid('playlist', code) FROM unnest(ARRAY['A', 'B', 'C', 'D']) code);

DELETE FROM bioimpedance_log
WHERE bioimpedance_id IN (SELECT pg_temp.seed_uuid('bio', n::text) FROM generate_series(0, 6000) n);

DELETE FROM bioimpedance
WHERE user_id = (SELECT user_id FROM seed_ctx)
  AND id IN (SELECT pg_temp.seed_uuid('bio', n::text) FROM generate_series(0, 6000) n);

DELETE FROM exercises
WHERE user_id = (SELECT user_id FROM seed_ctx)
  AND id IN (SELECT pg_temp.seed_uuid('exercise', lower(trim(name))) FROM (VALUES
      ('Remada baixa'), ('Stiff'), ('Panturrilha em pé'), ('Rosca martelo'),
      ('Tríceps corda'), ('Elevação pélvica'), ('Crucifixo máquina'), ('Face pull')) AS v (name));

-- ---------------------------------------------------------------------------------------------
-- Exercícios próprios do usuário (o catálogo global já traz os demais)
-- ---------------------------------------------------------------------------------------------

INSERT INTO exercises (id, created_at, name, primary_muscle, secondary_muscle, equipment, increment_kg,
                       is_archived, user_id)
SELECT pg_temp.seed_uuid('exercise', lower(trim(v.name))),
       (SELECT start_date FROM seed_ctx)::timestamp AT TIME ZONE (SELECT tz FROM seed_ctx),
       v.name, v.primary_muscle, v.secondary_muscle, v.equipment, v.increment_kg, FALSE,
       (SELECT user_id FROM seed_ctx)
FROM (VALUES
    ('Remada baixa',      'Costas', 'Bíceps',   'Cabo',     5.0),
    ('Stiff',             'Pernas', 'Glúteos',  'Barra',    2.5),
    ('Panturrilha em pé', 'Pernas', NULL,       'Máquina',  5.0),
    ('Rosca martelo',     'Bíceps', 'Antebraço','Halteres', 2.0),
    ('Tríceps corda',     'Tríceps', NULL,      'Cabo',     2.5),
    ('Elevação pélvica',  'Glúteos', 'Pernas',  'Barra',    5.0),
    ('Crucifixo máquina', 'Peito',  'Ombro',    'Máquina',  5.0),
    ('Face pull',         'Ombro',  'Costas',   'Cabo',     2.5)
) AS v (name, primary_muscle, secondary_muscle, equipment, increment_kg)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------------------------
-- Fichas (planos) e seus exercícios
-- ---------------------------------------------------------------------------------------------

-- weekday: ISO (1 = segunda). Quatro treinos por semana: seg, ter, qui, sex.
CREATE TEMP TABLE seed_plan ON COMMIT DROP AS
SELECT * FROM (VALUES
    ('A', 'Treino A · Peito, ombro e tríceps', 'Empurrar: foco em força no supino e volume de ombro.',  1),
    ('B', 'Treino B · Costas e bíceps',        'Puxar: terra pesado, remadas e puxadas.',                2),
    ('C', 'Treino C · Pernas',                 'Quadríceps, posterior, glúteo e panturrilha.',           4),
    ('D', 'Treino D · Ombro e braços',         'Volume leve para ombro, peitoral superior e braços.',    5)
) AS v (code, name, description, weekday);

-- base_kg = carga de trabalho no início da janela.
CREATE TEMP TABLE seed_blueprint ON COMMIT DROP AS
SELECT b.code, b.ord, e.id AS exercise_id, b.sets, b.rmin, b.rmax, b.rest, b.base_kg,
       COALESCE(NULLIF(e.increment_kg, 0), 2.5)::numeric AS inc, b.note
FROM (VALUES
    ('A', 1, 'Supino reto',             4,  6, 10, 120, 60.0, 'Pausa curta no peito, descida controlada.'),
    ('A', 2, 'Supino inclinado',        3,  8, 12,  90, 45.0, NULL),
    ('A', 3, 'Desenvolvimento militar', 3,  8, 10,  90, 32.5, NULL),
    ('A', 4, 'Elevação lateral',        3, 12, 15,  60,  8.0, 'Sem embalo.'),
    ('A', 5, 'Tríceps corda',           3, 10, 15,  60, 25.0, NULL),
    ('A', 6, 'Tríceps testa',           3,  8, 12,  60, 25.0, NULL),
    ('B', 1, 'Levantamento terra',      3,  5,  8, 150, 90.0, 'Série de aquecimento antes da primeira.'),
    ('B', 2, 'Puxada alta',             4,  8, 12,  90, 55.0, NULL),
    ('B', 3, 'Remada curvada',          4,  8, 10,  90, 50.0, NULL),
    ('B', 4, 'Remada baixa',            3, 10, 12,  75, 45.0, NULL),
    ('B', 5, 'Rosca direta',            3,  8, 12,  60, 30.0, NULL),
    ('B', 6, 'Rosca martelo',           3, 10, 12,  60, 14.0, NULL),
    ('C', 1, 'Agachamento livre',       4,  6, 10, 150, 80.0, 'Profundidade abaixo do paralelo.'),
    ('C', 2, 'Leg press',               4, 10, 15, 120, 180.0, NULL),
    ('C', 3, 'Stiff',                   3,  8, 12,  90, 60.0, NULL),
    ('C', 4, 'Cadeira extensora',       3, 12, 15,  60, 45.0, NULL),
    ('C', 5, 'Mesa flexora',            3, 10, 15,  60, 40.0, NULL),
    ('C', 6, 'Elevação pélvica',        3, 10, 12,  90, 70.0, NULL),
    ('C', 7, 'Panturrilha em pé',       4, 12, 20,  45, 70.0, NULL),
    ('D', 1, 'Crucifixo máquina',       3, 12, 15,  60, 40.0, NULL),
    ('D', 2, 'Face pull',               3, 12, 15,  60, 25.0, NULL),
    ('D', 3, 'Elevação lateral',        4, 12, 15,  45,  8.0, NULL),
    ('D', 4, 'Rosca alternada',         3, 10, 12,  60, 12.0, NULL),
    ('D', 5, 'Tríceps corda',           3, 10, 15,  60, 25.0, NULL),
    ('D', 6, 'Puxada alta',             3, 10, 12,  75, 50.0, NULL)
) AS b (code, ord, exercise_name, sets, rmin, rmax, rest, base_kg, note)
JOIN LATERAL (
    -- exercício do próprio usuário tem prioridade sobre o global de mesmo nome
    SELECT x.id, x.increment_kg
    FROM exercises x
    WHERE lower(trim(x.name)) = lower(trim(b.exercise_name))
      AND (x.user_id IS NULL OR x.user_id = (SELECT user_id FROM seed_ctx))
    ORDER BY x.user_id NULLS LAST
    LIMIT 1
) e ON TRUE;

DO
$$
BEGIN
    IF (SELECT count(*) FROM seed_blueprint) <> 25 THEN
        RAISE EXCEPTION 'Algum exercício das fichas não foi encontrado no catálogo (esperado 25, resolvido %).',
            (SELECT count(*) FROM seed_blueprint);
    END IF;
END
$$;

INSERT INTO playlists (id, created_at, updated_at, name, user_id, description)
SELECT pg_temp.seed_uuid('playlist', p.code),
       (c.start_date - 1)::timestamp AT TIME ZONE c.tz,
       NULL, p.name, c.user_id, p.description
FROM seed_plan p, seed_ctx c;

INSERT INTO playlist_exercise (id, created_at, updated_at, order_index, target_sets, playlist_id, exercise_id,
                               target_reps_min, target_reps_max, rest_seconds, note, target_weight_kg)
SELECT pg_temp.seed_uuid('pe', b.code || '|' || b.ord),
       (c.start_date - 1)::timestamp AT TIME ZONE c.tz,
       NULL, b.ord, b.sets, pg_temp.seed_uuid('playlist', b.code), b.exercise_id,
       b.rmin, b.rmax, b.rest, b.note, b.base_kg
FROM seed_blueprint b, seed_ctx c;

-- ---------------------------------------------------------------------------------------------
-- Sessões de treino (uma por dia de treino, ~10% de faltas) já finalizadas
-- ---------------------------------------------------------------------------------------------

CREATE TEMP TABLE seed_session ON COMMIT DROP AS
SELECT d.dayno, p.code,
       pg_temp.seed_uuid('session', d.dayno::text) AS id,
       s.started_at,
       s.started_at + make_interval(mins => 50 + pg_temp.seed_rnd('dur|' || d.dayno, 31)) AS ended_at
FROM seed_ctx c
CROSS JOIN LATERAL (
    SELECT c.start_date + i AS day, (c.start_date + i) - DATE '2020-01-01' AS dayno
    FROM generate_series(0, :days::int - 1) i
) d
JOIN seed_plan p ON p.weekday = EXTRACT(isodow FROM d.day)
CROSS JOIN LATERAL (
    SELECT (d.day + TIME '17:30'
            + make_interval(mins => pg_temp.seed_rnd('start|' || d.dayno, 150))) AT TIME ZONE c.tz AS started_at
) s
WHERE pg_temp.seed_rnd('skip|' || d.dayno, 10) <> 0
  AND s.started_at + make_interval(mins => 81) <= now();

INSERT INTO workout_session (id, created_at, updated_at, started_at, ended_at, total_volume, playlist_id,
                             user_id, status, notes, version)
SELECT s.id, s.ended_at, NULL, s.started_at, s.ended_at, 0, pg_temp.seed_uuid('playlist', s.code),
       c.user_id, 'FINISHED',
       CASE pg_temp.seed_rnd('note|' || s.dayno, 12)
           WHEN 0 THEN 'Dormi mal, mantive as cargas.'
           WHEN 1 THEN 'Treino forte, bateu carga nova.'
           WHEN 2 THEN 'Academia lotada, descansos mais curtos.'
       END,
       0
FROM seed_session s, seed_ctx c;

-- ---------------------------------------------------------------------------------------------
-- Séries registradas: carga sobe ~1,2%/semana (arredondada ao incremento), reps caem ao longo das séries
-- ---------------------------------------------------------------------------------------------

INSERT INTO workout_log (id, created_at, updated_at, set_number, weight, reps, is_pr, exercise_id,
                         workout_session_id, client_log_id, rpe, notes)
SELECT pg_temp.seed_uuid('log', k.key),
       s.started_at + make_interval(mins => (b.ord - 1) * 8 + g * 2),
       NULL, g,
       GREATEST(b.inc,
                round((b.base_kg * (1 + 0.012 * ((s.dayno - c.start_dayno) / 7.0)) / b.inc)::numeric)::numeric * b.inc
                - CASE WHEN pg_temp.seed_rnd('bad|' || s.dayno || '|' || b.ord, 9) = 0 THEN b.inc ELSE 0 END)::double precision,
       GREATEST(b.rmin - 1, b.rmax - (g - 1) - pg_temp.seed_rnd('reps|' || k.key, 2)),
       FALSE, b.exercise_id, s.id, pg_temp.seed_uuid('clientlog', k.key),
       LEAST(9, 6 + LEAST(g, 3) + pg_temp.seed_rnd('rpe|' || k.key, 2)),
       CASE WHEN g = b.sets AND pg_temp.seed_rnd('fail|' || k.key, 15) = 0 THEN 'Última repetição no limite.' END
FROM seed_session s
JOIN seed_blueprint b ON b.code = s.code
CROSS JOIN seed_ctx c
CROSS JOIN LATERAL generate_series(1, b.sets) g
CROSS JOIN LATERAL (SELECT s.dayno || '|' || b.ord || '|' || g AS key) k;

-- PR no mesmo critério do app: e1RM (Epley) maior que o melhor de todas as sessões anteriores.
WITH set_scores AS (
    SELECT l.id, l.exercise_id, l.workout_session_id, s.started_at,
           l.weight * (1 + l.reps / 30.0) AS e1rm
    FROM workout_log l
    JOIN seed_session ss ON ss.id = l.workout_session_id
    JOIN workout_session s ON s.id = ss.id
),
session_best AS (
    SELECT exercise_id, workout_session_id, started_at, max(e1rm) AS best
    FROM set_scores
    GROUP BY exercise_id, workout_session_id, started_at
),
prior_best AS (
    SELECT exercise_id, workout_session_id,
           max(best) OVER (PARTITION BY exercise_id ORDER BY started_at
                           ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING) AS prior
    FROM session_best
)
UPDATE workout_log l
SET is_pr = (sc.e1rm > COALESCE(pb.prior, 0))
FROM set_scores sc
JOIN prior_best pb ON pb.exercise_id = sc.exercise_id AND pb.workout_session_id = sc.workout_session_id
WHERE l.id = sc.id;

-- Volume da sessão = soma de carga x reps das séries.
UPDATE workout_session s
SET total_volume = v.volume
FROM (SELECT workout_session_id, sum(weight * reps) AS volume
      FROM workout_log
      WHERE workout_session_id IN (SELECT id FROM seed_session)
      GROUP BY workout_session_id) v
WHERE s.id = v.workout_session_id;

-- A ficha passa a sugerir a carga mais recente de cada exercício.
UPDATE playlist_exercise pe
SET target_weight_kg = t.weight
FROM (SELECT DISTINCT ON (s.playlist_id, l.exercise_id) s.playlist_id, l.exercise_id, l.weight
      FROM workout_log l
      JOIN workout_session s ON s.id = l.workout_session_id
      WHERE s.id IN (SELECT id FROM seed_session)
      ORDER BY s.playlist_id, l.exercise_id, s.started_at DESC, l.set_number) t
WHERE pe.playlist_id = t.playlist_id AND pe.exercise_id = t.exercise_id;

-- ---------------------------------------------------------------------------------------------
-- "Fiz o treino": uma marcação por sessão, apontando para ela (mesmo formato do app)
-- ---------------------------------------------------------------------------------------------

INSERT INTO workout_completion (id, user_id, playlist_id, completed_at, created_at, updated_at,
                                workout_session_id)
SELECT pg_temp.seed_uuid('completion', s.dayno::text), c.user_id, pg_temp.seed_uuid('playlist', s.code),
       s.ended_at, s.ended_at, NULL, s.id
FROM seed_session s, seed_ctx c;

-- ---------------------------------------------------------------------------------------------
-- Exercícios fixados no painel de Progresso (só se o usuário ainda não fixou nenhum)
-- ---------------------------------------------------------------------------------------------

INSERT INTO user_pinned_exercises (id, created_at, updated_at, user_id, exercise_id, position)
SELECT pg_temp.seed_uuid('pin', (v.position)::text), now(), NULL, c.user_id, e.id, v.position
FROM seed_ctx c
CROSS JOIN (VALUES (0, 'A', 1), (1, 'C', 1), (2, 'B', 1), (3, 'A', 3)) AS v (position, code, ord)
JOIN seed_blueprint b ON b.code = v.code AND b.ord = v.ord
JOIN exercises e ON e.id = b.exercise_id
WHERE NOT EXISTS (SELECT 1 FROM user_pinned_exercises p WHERE p.user_id = c.user_id);

-- ---------------------------------------------------------------------------------------------
-- Bioimpedância: uma medição por semana, de manhã, com tendência de recomposição corporal
-- ---------------------------------------------------------------------------------------------

INSERT INTO bioimpedance (id, created_at, updated_at, body_fat_percentage, muscle_mass_kg, visceral_fat,
                          measured_at, water_percentage, user_id, body_weight_kg, height_cm,
                          skeletal_muscle_mass_kg, source, source_file_hash, deleted_at, source_file_name)
SELECT pg_temp.seed_uuid('bio', m.dayno::text),
       m.measured_at, NULL,
       round((21.8 - 2.9 * m.t + (pg_temp.seed_rnd('fat|' || m.dayno, 5) - 2) * 0.1)::numeric, 1),
       round((37.2 + 1.4 * m.t + (pg_temp.seed_rnd('mus|' || m.dayno, 5) - 2) * 0.1)::numeric, 1),
       round(9 - 2 * m.t)::double precision,
       m.measured_at,
       round((55.0 + 2.2 * m.t + (pg_temp.seed_rnd('wat|' || m.dayno, 5) - 2) * 0.1)::numeric, 1),
       c.user_id,
       round((84.0 - 3.2 * m.t + (pg_temp.seed_rnd('wei|' || m.dayno, 7) - 3) * 0.1)::numeric, 1),
       178,
       round((35.1 + 1.4 * m.t + (pg_temp.seed_rnd('ske|' || m.dayno, 5) - 2) * 0.1)::numeric, 1),
       CASE WHEN m.k % 4 = 0 THEN 'IMPORT' ELSE 'MANUAL' END,
       CASE WHEN m.k % 4 = 0 THEN md5('hash1|' || m.dayno) || md5('hash2|' || m.dayno) END,
       NULL,
       CASE WHEN m.k % 4 = 0 THEN 'bioimpedancia-' || to_char(m.measured_at AT TIME ZONE c.tz, 'YYYY-MM-DD') || '.pdf' END
FROM seed_ctx c
CROSS JOIN LATERAL (
    SELECT k, (c.start_date + 7 * k) - DATE '2020-01-01' AS dayno,
           k::numeric / GREATEST(1, ((:days::int - 1) / 7)) AS t,
           ((c.start_date + 7 * k) + TIME '07:30'
            + make_interval(mins => pg_temp.seed_rnd('bio|' || k, 45))) AT TIME ZONE c.tz AS measured_at
    FROM generate_series(0, (:days::int - 1) / 7) k
) m
WHERE m.measured_at <= now()
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------------------------
-- Resumo do que ficou no banco para o usuário-alvo
-- ---------------------------------------------------------------------------------------------

SELECT u.email,
       (SELECT count(*) FROM playlists p WHERE p.user_id = u.id)                         AS fichas,
       (SELECT count(*) FROM exercises e WHERE e.user_id = u.id)                         AS exercicios_proprios,
       (SELECT count(*) FROM workout_session s WHERE s.user_id = u.id AND s.status = 'FINISHED') AS sessoes,
       (SELECT count(*) FROM workout_log l JOIN workout_session s ON s.id = l.workout_session_id
         WHERE s.user_id = u.id)                                                          AS series,
       (SELECT count(*) FROM workout_log l JOIN workout_session s ON s.id = l.workout_session_id
         WHERE s.user_id = u.id AND l.is_pr)                                             AS prs,
       (SELECT count(*) FROM workout_completion w WHERE w.user_id = u.id)                AS marcacoes,
       (SELECT count(*) FROM bioimpedance b WHERE b.user_id = u.id AND b.deleted_at IS NULL) AS bioimpedancias,
       (SELECT min(started_at)::date FROM workout_session s WHERE s.user_id = u.id)      AS primeiro_treino,
       (SELECT max(started_at)::date FROM workout_session s WHERE s.user_id = u.id)      AS ultimo_treino
FROM users u
WHERE u.id = (SELECT user_id FROM seed_ctx);

DROP FUNCTION pg_temp.seed_uuid(text, text);
DROP FUNCTION pg_temp.seed_rnd(text, int);

\if :{?dry_run}
ROLLBACK;
\echo '>> dry_run: nada foi gravado (ROLLBACK).'
\else
COMMIT;
\echo '>> seed aplicado.'
\endif
