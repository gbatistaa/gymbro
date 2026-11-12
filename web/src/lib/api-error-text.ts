import axios from "axios";
import { apiErrorSchema } from "@/contracts/api-error";

/**
 * Mensagens PT-BR acionáveis para falhas de API. O cliente decide pelo `code` estável, nunca pelo
 * texto de `message`.
 */
const CODE_MESSAGES: Record<string, string> = {
  UNAUTHENTICATED: "Sua sessão expirou. Entre novamente.",
  FORBIDDEN: "Você não tem permissão para esta ação.",
  NOT_FOUND: "Não encontramos este conteúdo.",
  VALIDATION_FAILED: "Verifique os campos destacados.",
  RESOURCE_ALREADY_EXISTS: "Já existe um registro com estes dados.",
  CONFLICT: "A ação não pôde ser concluída no estado atual.",
  DATA_CONFLICT: "Os dados mudaram enquanto você editava. Recarregue e tente de novo.",
  TOO_MANY_ATTEMPTS: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
  PAYLOAD_TOO_LARGE: "O arquivo é grande demais.",
};

const GENERIC_ERROR = "Não foi possível concluir. Tente novamente.";
const NETWORK_ERROR =
  "Não foi possível conectar. Verifique sua conexão e tente novamente.";

export function describeApiError(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return "Algo deu errado. Tente novamente.";
  }

  if (!error.response) {
    return NETWORK_ERROR;
  }

  const parsed = apiErrorSchema.safeParse(error.response.data);
  if (!parsed.success) {
    return GENERIC_ERROR;
  }

  return CODE_MESSAGES[parsed.data.code] ?? GENERIC_ERROR;
}
