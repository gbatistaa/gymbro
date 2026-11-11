import axios from "axios";
import type { ZodError } from "zod";
import { apiErrorSchema } from "@/contracts/api-error";

export type AuthField = "name" | "email" | "password";
export type FieldErrors = Partial<Record<AuthField, string>>;

const FIELD_MESSAGES: Record<AuthField, string> = {
  name: "Verifique o nome informado.",
  email: "Verifique o e-mail informado.",
  password: "Verifique a senha informada.",
};

const CODE_MESSAGES: Record<string, string> = {
  UNAUTHENTICATED: "E-mail ou senha inválidos.",
  TOO_MANY_ATTEMPTS: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
  RESOURCE_ALREADY_EXISTS: "Já existe uma conta com este e-mail.",
  VALIDATION_FAILED: "Verifique os campos destacados.",
  MALFORMED_BODY: "Dados inválidos. Verifique os campos.",
  BAD_REQUEST: "Dados inválidos. Verifique os campos.",
};

export function toFieldErrors(error: ZodError): FieldErrors {
  const fields: FieldErrors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (field === "name" || field === "email" || field === "password") {
      fields[field] ??= issue.message;
    }
  }

  return fields;
}

export function describeAuthError(error: unknown): {
  message: string;
  fields: FieldErrors;
} {
  if (!axios.isAxiosError(error)) {
    return { message: "Algo deu errado. Tente novamente.", fields: {} };
  }

  if (!error.response) {
    return {
      message: "Não foi possível conectar. Verifique sua conexão e tente novamente.",
      fields: {},
    };
  }

  const parsed = apiErrorSchema.safeParse(error.response.data);
  if (!parsed.success) {
    return { message: "Não foi possível concluir. Tente novamente.", fields: {} };
  }

  const fields: FieldErrors = {};
  for (const item of parsed.data.errors) {
    if (item.field === "name" || item.field === "email" || item.field === "password") {
      fields[item.field] = FIELD_MESSAGES[item.field];
    }
  }

  return {
    message: CODE_MESSAGES[parsed.data.code] ?? "Não foi possível concluir. Tente novamente.",
    fields,
  };
}
