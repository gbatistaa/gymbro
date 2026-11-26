-- author: jacob
-- Fichas passam a guardar o peso-alvo de cada exercício, e o "fiz o treino" passa a poder registrar
-- os exercícios feitos. O registro vira uma sessão já finalizada (sem cronômetro), para que volume,
-- PRs e progresso continuem saindo de workout_log sem uma segunda fonte de verdade.

ALTER TABLE playlist_exercise
    ADD COLUMN target_weight_kg DOUBLE PRECISION,
    ADD CONSTRAINT ck_target_weight CHECK (target_weight_kg IS NULL OR target_weight_kg >= 0);

ALTER TABLE workout_completion
    ADD COLUMN workout_session_id UUID REFERENCES workout_session (id) ON DELETE SET NULL;
