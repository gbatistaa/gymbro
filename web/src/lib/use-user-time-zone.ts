"use client";

import { useAtomValue } from "jotai";
import { sessionAtom } from "@/stores/session";

/** Fuso do perfil do usuário; sem sessão carregada, o do aparelho. */
export function useUserTimeZone(): string {
  const timeZone = useAtomValue(sessionAtom)?.user.timezone;
  return timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
}
