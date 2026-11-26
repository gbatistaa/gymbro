import { z } from "zod";
import { isKnownTimeZone } from "@/lib/timezones";

/** Campos editáveis do perfil. Username e senha têm fluxo próprio e não entram aqui. */
export const profileFormSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome."),
  email: z.email("Informe um e-mail válido."),
  timezone: z
    .string()
    .refine(isKnownTimeZone, "Escolha um fuso horário válido."),
});

export type ProfileFormInput = z.infer<typeof profileFormSchema>;
