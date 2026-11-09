-- Repeatable seed of the global catalog. ON CONFLICT keeps it idempotent.
INSERT INTO exercises (id, created_at, name, primary_muscle, secondary_muscle, equipment, increment_kg, is_archived)
VALUES
    (gen_random_uuid(), now(), 'Supino reto', 'Peito', 'Tríceps', 'Barra', 2.5, FALSE),
    (gen_random_uuid(), now(), 'Supino inclinado', 'Peito', 'Ombro', 'Barra', 2.5, FALSE),
    (gen_random_uuid(), now(), 'Crucifixo', 'Peito', 'Ombro', 'Halteres', 2.0, FALSE),
    (gen_random_uuid(), now(), 'Agachamento livre', 'Pernas', 'Glúteos', 'Barra', 2.5, FALSE),
    (gen_random_uuid(), now(), 'Leg press', 'Pernas', 'Glúteos', 'Máquina', 5.0, FALSE),
    (gen_random_uuid(), now(), 'Cadeira extensora', 'Pernas', NULL, 'Máquina', 5.0, FALSE),
    (gen_random_uuid(), now(), 'Mesa flexora', 'Pernas', NULL, 'Máquina', 5.0, FALSE),
    (gen_random_uuid(), now(), 'Levantamento terra', 'Costas', 'Pernas', 'Barra', 2.5, FALSE),
    (gen_random_uuid(), now(), 'Remada curvada', 'Costas', 'Bíceps', 'Barra', 2.5, FALSE),
    (gen_random_uuid(), now(), 'Puxada alta', 'Costas', 'Bíceps', 'Máquina', 5.0, FALSE),
    (gen_random_uuid(), now(), 'Desenvolvimento militar', 'Ombro', 'Tríceps', 'Barra', 2.5, FALSE),
    (gen_random_uuid(), now(), 'Elevação lateral', 'Ombro', NULL, 'Halteres', 2.0, FALSE),
    (gen_random_uuid(), now(), 'Rosca direta', 'Bíceps', 'Antebraço', 'Barra', 2.5, FALSE),
    (gen_random_uuid(), now(), 'Rosca alternada', 'Bíceps', 'Antebraço', 'Halteres', 2.0, FALSE),
    (gen_random_uuid(), now(), 'Tríceps testa', 'Tríceps', NULL, 'Barra', 2.5, FALSE),
    (gen_random_uuid(), now(), 'Abdominal', 'Abdômen', NULL, 'Peso corporal', 0.0, FALSE)
ON CONFLICT DO NOTHING;
