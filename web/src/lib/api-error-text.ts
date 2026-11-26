import axios from "axios";
import { apiErrorSchema, type ApiError } from "@/contracts/api-error";

const UNKNOWN_ERROR = "Algo deu errado. Tente novamente.";
const NETWORK_ERROR = "Não foi possível conectar. Verifique sua conexão e tente novamente.";
const UNREADABLE_ERROR = "Não foi possível concluir. Tente novamente.";

/**
 * Mensagens exatamente como o backend as enviou: cada `errors[].message` quando há erros por
 * campo (validação), senão o `message` geral. Só falhas sem resposta legível do backend (rede,
 * proxy, erro inesperado do cliente) usam texto local.
 */
export function apiErrorMessages(error: unknown): string[] {
  if (!axios.isAxiosError(error)) return [UNKNOWN_ERROR];
  if (!error.response) return [NETWORK_ERROR];

  const parsed = apiErrorSchema.safeParse(error.response.data);
  if (!parsed.success) return [UNREADABLE_ERROR];

  const { errors, message } = parsed.data;
  const messages = errors.length > 0 ? errors.map((item) => item.message) : [message];

  return [...new Set(messages)];
}

/** Erros por campo (`errors[]`) como o backend os enviou; vazio se não houver resposta legível. */
export function apiFieldMessages(error: unknown): ApiError["errors"] {
  if (!axios.isAxiosError(error)) return [];

  const parsed = apiErrorSchema.safeParse(error.response?.data);
  return parsed.success ? parsed.data.errors : [];
}

/** `code` estável do erro do backend, para o cliente explicar a causa; `null` sem resposta legível. */
export function apiErrorCode(error: unknown): string | null {
  if (!axios.isAxiosError(error)) return null;

  const parsed = apiErrorSchema.safeParse(error.response?.data);
  return parsed.success ? parsed.data.code : null;
}

/** Todas as mensagens do backend em uma só linha, para estados de tela (`ErrorState`). */
export function describeApiError(error: unknown): string {
  return apiErrorMessages(error).join("; ");
}
