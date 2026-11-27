"use client";

import { useSetAtom } from "jotai";
import { useEffect } from "react";
import { profilePhotoAtom } from "@/stores/profile-photo";
import { fetchProfilePhoto } from "./photo-api";

/**
 * Carrega a foto do usuário no átomo compartilhado. Sem foto (ou falha ao buscar), a barra mostra
 * as iniciais: a foto é decorativa, então a falha não bloqueia a navegação.
 */
export function useLoadProfilePhoto(): void {
  const setPhoto = useSetAtom(profilePhotoAtom);

  useEffect(() => {
    let ignore = false;

    fetchProfilePhoto().then(
      (loaded) => {
        if (!ignore) setPhoto(loaded);
      },
      () => {
        if (!ignore) setPhoto(null);
      },
    );

    return () => {
      ignore = true;
    };
  }, [setPhoto]);
}
