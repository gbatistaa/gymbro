import { z } from "zod";

export const userSummarySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email(),
  timezone: z.string(),
  createdAt: z.iso.datetime({ offset: true }),
});

export const authUserSchema = userSummarySchema.extend({
  updatedAt: z.iso.datetime({ offset: true }),
});

export const authTokensSchema = z.object({
  accessToken: z.string().min(1),
  tokenType: z.string(),
  expiresIn: z.number().int().positive(),
  refreshToken: z.string().min(1),
});

export const loginSchema = z.object({
  email: z.email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe a senha."),
});

export const signUpSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome."),
  email: z.email("Informe um e-mail válido."),
  password: z.string().min(8, "A senha precisa ter ao menos 8 caracteres."),
});

export const refreshRequestSchema = z.object({
  refreshToken: z.string().min(1),
});

export type AuthUser = z.infer<typeof authUserSchema>;
export type UserSummary = z.infer<typeof userSummarySchema>;
export type AuthTokens = z.infer<typeof authTokensSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
