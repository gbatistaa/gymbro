import { toast } from "sonner";
import type { ZodError } from "zod";
import { apiErrorMessages } from "./api-error-text";

/** Um toast de erro por mensagem distinta. */
export function notifyErrors(messages: readonly string[]) {
  for (const message of new Set(messages)) {
    toast.error(message);
  }
}

/** Falha de API: um toast por mensagem enviada pelo backend. */
export function notifyApiError(error: unknown) {
  notifyErrors(apiErrorMessages(error));
}

/** Validação no cliente: um toast por problema encontrado pelo schema. */
export function notifyValidation(error: ZodError) {
  notifyErrors(error.issues.map((issue) => issue.message));
}
