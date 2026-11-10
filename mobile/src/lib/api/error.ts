/**
 * Erro de API, já no vocabulário do backend.
 *
 * `code` é a chave estável (contrato em `docs/adr/0001-contrato-de-erro.md`); `message` é texto
 * para humano e pode mudar sem aviso — por isso nenhuma tela decide nada a partir dele.
 */
export type ApiFieldError = {
  field: string;
  message: string;
};

type ApiErrorParams = {
  code: string;
  status: number;
  message?: string;
  path?: string;
  fields?: ApiFieldError[];
  /** Valor de `Retry-After`, em segundos, quando o servidor manda esperar. */
  retryAfterSeconds?: number;
};

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly fields: ApiFieldError[];
  readonly path?: string;
  readonly retryAfterSeconds?: number;

  constructor({ code, status, message, path, fields, retryAfterSeconds }: ApiErrorParams) {
    super(message ?? code);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.fields = fields ?? [];
    this.path = path;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/** Falha antes de haver resposta: DNS, TLS, timeout, modo avião. */
export function networkError(message?: string): ApiError {
  return new ApiError({ code: 'NETWORK', status: 0, message });
}

/**
 * Converte o corpo de uma resposta de erro em `ApiError`.
 *
 * O corpo é entrada não confiável: um proxy pode devolver HTML, um campo pode vir com tipo
 * errado. Nada aqui confia no formato — o que não casar com o contrato vira código derivado do
 * status, e a tela continua sabendo o que mostrar.
 */
export function parseErrorResponse(
  status: number,
  body: unknown,
  retryAfterSeconds?: number,
): ApiError {
  const record = isRecord(body) ? body : undefined;
  const code = typeof record?.code === 'string' && record.code.length > 0 ? record.code : codeForStatus(status);

  return new ApiError({
    code,
    status,
    message: typeof record?.message === 'string' ? record.message : undefined,
    path: typeof record?.path === 'string' ? record.path : undefined,
    fields: narrowFields(record?.errors),
    retryAfterSeconds,
  });
}

function codeForStatus(status: number): string {
  if (status === 401) {
    return 'UNAUTHENTICATED';
  }
  if (status === 403) {
    return 'FORBIDDEN';
  }
  if (status === 404) {
    return 'NOT_FOUND';
  }
  return status >= 500 ? 'INTERNAL_ERROR' : 'UNEXPECTED_RESPONSE';
}

function narrowFields(value: unknown): ApiFieldError[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!isRecord(item)) {
      return [];
    }
    const { field, message } = item;
    return typeof field === 'string' && typeof message === 'string' ? [{ field, message }] : [];
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
