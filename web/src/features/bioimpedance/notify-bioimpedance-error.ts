import { apiErrorCode } from "@/lib/api-error-text";
import { notifyApiError, notifyErrors } from "@/lib/notify";

/** Conflitos conhecidos do domínio, explicados com a ação que resolve cada um. */
const CONFLICT_MESSAGES: Record<string, string> = {
  BIOIMPEDANCE_MEASUREMENT_TIME_TAKEN:
    "Já existe uma medição nesta data e hora. Ajuste o horário para salvar esta.",
  BIOIMPEDANCE_FILE_ALREADY_IMPORTED:
    "Este laudo já foi importado e está no seu histórico de medições.",
  BIOIMPEDANCE_IMPORT_ALREADY_CONFIRMED: "Esta importação já foi salva no seu histórico.",
};

/** Falha de uma ação de bioimpedância: conflito conhecido em PT-BR, senão a mensagem do backend. */
export function notifyBioimpedanceError(error: unknown) {
  const code = apiErrorCode(error);
  const message = code ? CONFLICT_MESSAGES[code] : undefined;

  if (message) {
    notifyErrors([message]);
  } else {
    notifyApiError(error);
  }
}
