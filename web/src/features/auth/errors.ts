import type { ZodError } from "zod";
import { apiFieldMessages } from "@/lib/api-error-text";

export type AuthField = "name" | "username" | "email" | "identifier" | "password";
export type FieldErrors = Partial<Record<AuthField, string>>;

const AUTH_FIELDS: readonly string[] = [
  "name",
  "username",
  "email",
  "identifier",
  "password",
];

function isAuthField(value: string): value is AuthField {
  return AUTH_FIELDS.includes(value);
}

export function toFieldErrors(error: ZodError): FieldErrors {
  const fields: FieldErrors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && isAuthField(field)) {
      fields[field] ??= issue.message;
    }
  }

  return fields;
}

/** Marca cada campo com a mensagem exata que o backend enviou para ele. */
export function toServerFieldErrors(error: unknown): FieldErrors {
  const fields: FieldErrors = {};

  for (const item of apiFieldMessages(error)) {
    if (isAuthField(item.field)) {
      fields[item.field] ??= item.message;
    }
  }

  return fields;
}
