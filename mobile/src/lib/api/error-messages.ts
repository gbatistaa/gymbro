import { ApiError, networkError, type ApiFieldError } from './error';

/**
 * Uma mensagem por código, em PT-BR e na voz do produto: direta, sem "ops", sem exclamação.
 *
 * Nenhuma tela escreve mensagem de erro própria — se escrevesse, a mesma falha teria dois textos
 * diferentes conforme a tela, e o vocabulário do app passaria a depender de quem programou.
 */
export const GENERIC_MESSAGE = 'Não foi possível concluir a ação. Tente de novo.';

const MESSAGES: Record<string, string> = {
  NOT_FOUND: 'Não encontramos o que você procurava.',
  FORBIDDEN: 'Você não tem permissão para isso.',
  UNAUTHENTICATED: 'Sessão expirada. Entre de novo.',
  BAD_REQUEST: 'Os dados enviados não são válidos.',
  INVALID_PARAMETER: 'Os dados enviados não são válidos.',
  MALFORMED_BODY: 'Os dados enviados não são válidos.',
  VALIDATION_FAILED: 'Confira os campos destacados.',
  CONFLICT: 'A ação conflita com o estado atual.',
  SESSION_ALREADY_ACTIVE: 'Já existe um treino aberto.',
  CLIENT_LOG_CONFLICT: 'Essa série já foi registrada com outros valores.',
  RESOURCE_ALREADY_EXISTS: 'Já existe um registro com esses dados.',
  DATA_CONFLICT: 'A ação conflita com o estado atual.',
  STALE_WRITE: 'Alguém alterou isso antes de você. Recarregue.',
  PAYLOAD_TOO_LARGE: 'O arquivo é grande demais.',
  UNSUPPORTED_MEDIA_TYPE: 'Formato de arquivo não aceito.',
  METHOD_NOT_ALLOWED: 'Ação não permitida.',
  INTERNAL_ERROR: 'Erro no servidor. Tente de novo.',
  TOO_MANY_ATTEMPTS: 'Muitas tentativas. Espere alguns minutos.',
  NETWORK: 'Sem conexão com o servidor.',
  UNEXPECTED_RESPONSE: 'Resposta inesperada do servidor. Tente de novo.',
};

export function messageForCode(code: string): string {
  return MESSAGES[code] ?? GENERIC_MESSAGE;
}

/**
 * Mensagem para qualquer coisa que tenha sido lançada, sem obrigar a tela a checar o tipo.
 *
 * Rate limit é o único caso em que a mensagem depende de um header: dizer "espere alguns minutos"
 * quando o servidor mandou 90 segundos é uma meia-verdade que o usuário descobre tentando de novo.
 */
export function messageForError(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return GENERIC_MESSAGE;
  }
  if (error.code === 'TOO_MANY_ATTEMPTS' && error.retryAfterSeconds !== undefined) {
    return `Muitas tentativas. Espere ${formatWait(error.retryAfterSeconds)}.`;
  }
  // em desenvolvimento, "sem conexão" sozinho manda procurar o problema na rede quando na verdade
  // pode ser EXPO_PUBLIC_API_URL apontando para um IP que mudou. Em produção, o host não interessa.
  if (isDevelopment() && error.code === 'NETWORK' && error.message !== error.code) {
    return `Sem conexão com ${error.message}. Confira EXPO_PUBLIC_API_URL.`;
  }
  return messageForCode(error.code);
}

function isDevelopment(): boolean {
  return typeof __DEV__ !== 'undefined' && __DEV__;
}

/**
 * Normaliza o que foi lançado para `ApiError`.
 *
 * `resolveBaseUrl()` lança `Error` puro quando falta `EXPO_PUBLIC_API_URL`. Sem esta conversão a
 * tela mostraria "erro inesperado" e o desenvolvedor procuraria no lugar errado.
 */
export function toApiError(cause: unknown): ApiError {
  if (cause instanceof ApiError) {
    return cause;
  }
  if (cause instanceof Error) {
    return networkError(cause.message);
  }
  return new ApiError({ code: 'UNEXPECTED_RESPONSE', status: 0 });
}

function formatWait(seconds: number): string {
  return seconds < 60 ? `${Math.ceil(seconds)} s` : `${Math.ceil(seconds / 60)} min`;
}

/**
 * Erros por campo, para posicionar a mensagem embaixo do input.
 *
 * Só faz sentido com `VALIDATION_FAILED`: é o único código que carrega `errors[]`.
 */
export function fieldMessages(error: ApiError): Record<string, string> {
  return error.fields.reduce<Record<string, string>>((byField, item: ApiFieldError) => {
    byField[item.field] = item.message;
    return byField;
  }, {});
}
