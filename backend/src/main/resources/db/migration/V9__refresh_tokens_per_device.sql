-- author: jacob
-- T6: um refresh token por login em vez de um por usuário, para que entrar no celular não
-- encerre a sessão do desktop. Linhas expiradas são removidas no próprio login (AuthService),
-- o que limita o crescimento por usuário às sessões ainda válidas.
ALTER TABLE refresh_tokens DROP CONSTRAINT uk_refresh_tokens_user;

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens (token_hash);
