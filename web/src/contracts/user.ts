import { z } from "zod";
import { isKnownTimeZone } from "@/lib/timezones";

/** Campos editáveis do perfil. Username e senha têm fluxo próprio e não entram aqui. */
export const profileFormSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome."),
  email: z.email("Informe um e-mail válido."),
  timezone: z.string().refine(isKnownTimeZone, "Escolha um fuso horário válido."),
});

export type ProfileFormInput = z.infer<typeof profileFormSchema>;

/** Mesmo limite da API (1 MB). */
export const PROFILE_PHOTO_MAX_BYTES = 1024 * 1024;

export const PROFILE_PHOTO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const;

export const PROFILE_PHOTO_MESSAGES = {
  required: "Escolha uma imagem para a foto de perfil.",
  empty: "A imagem está vazia. Escolha outra.",
  unsupportedType: "Use uma imagem PNG, JPEG, WEBP ou GIF.",
  tooLarge: "A foto pode ter no máximo 1 MB. Escolha uma imagem menor.",
} as const;

/** Arquivo escolhido pelo usuário, validado antes do envio. O backend repete a validação pelo conteúdo. */
export const profilePhotoFileSchema = z
  .file(PROFILE_PHOTO_MESSAGES.required)
  .min(1, PROFILE_PHOTO_MESSAGES.empty)
  .max(PROFILE_PHOTO_MAX_BYTES, PROFILE_PHOTO_MESSAGES.tooLarge)
  .mime([...PROFILE_PHOTO_TYPES], PROFILE_PHOTO_MESSAGES.unsupportedType);

/** `url` é um link assinado e temporário: serve para exibir, não para guardar. */
export const profilePhotoSchema = z.object({
  url: z.url(),
  contentType: z.enum(PROFILE_PHOTO_TYPES),
  sizeBytes: z.number().int().positive().max(PROFILE_PHOTO_MAX_BYTES),
});

export type ProfilePhoto = z.infer<typeof profilePhotoSchema>;
