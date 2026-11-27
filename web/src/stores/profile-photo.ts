import { atom } from "jotai";
import type { ProfilePhoto } from "@/contracts/user";

/** Foto do usuário logado, compartilhada pela barra superior e pela tela de perfil. */
export const profilePhotoAtom = atom<ProfilePhoto | null>(null);
