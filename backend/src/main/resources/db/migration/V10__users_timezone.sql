-- author: jacob
-- T11: cada usuário tem o seu fuso; dashboard, streak e "hoje" passam a ser calculados nele.
ALTER TABLE users ADD COLUMN timezone VARCHAR(64) NOT NULL DEFAULT 'America/Sao_Paulo';
