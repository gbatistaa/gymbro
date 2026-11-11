import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z
    .url()
    .default("http://localhost:8080")
    .transform((value) => value.replace(/\/+$/, "")),
});

const parsed = publicEnvSchema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});

if (!parsed.success) {
  throw new Error(`Variáveis públicas inválidas:\n${z.prettifyError(parsed.error)}`);
}

export const env = parsed.data;
