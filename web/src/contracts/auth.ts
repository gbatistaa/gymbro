import { z } from "zod";
import { isoDateTime } from "./primitives";

export const userSummarySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email(),
  username: z.string(),
  timezone: z.string(),
  createdAt: isoDateTime,
});

/** O login aceita e-mail ou username no mesmo campo; o formato só é validado no cadastro. */
export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Informe o e-mail ou usuário."),
  password: z.string().min(1, "Informe a senha."),
});

export const usernamePattern = /^[A-Za-z0-9_]([A-Za-z0-9_.]*[A-Za-z0-9_])?$/;

export const signUpSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome."),
  username: z
    .string()
    .trim()
    .min(3, "O usuário precisa ter ao menos 3 caracteres.")
    .max(30, "O usuário pode ter no máximo 30 caracteres.")
    .regex(
      usernamePattern,
      "Use letras, números, ponto ou sublinhado, sem começar nem terminar com ponto.",
    ),
  email: z.email("Informe um e-mail válido."),
  password: z.string().min(8, "A senha precisa ter ao menos 8 caracteres."),
});

export type UserSummary = z.infer<typeof userSummarySchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
