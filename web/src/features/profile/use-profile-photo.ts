"use client";

import { useSetAtom } from "jotai";
import { useState } from "react";
import { profilePhotoFileSchema, type ProfilePhoto } from "@/contracts/user";
import { notifySuccess, notifyValidation } from "@/lib/notify";
import { profilePhotoAtom } from "@/stores/profile-photo";
import { notifyProfilePhotoError } from "./notify-profile-photo-error";
import { removeProfilePhoto, uploadProfilePhoto } from "./photo-api";

type PendingAction = "upload" | "remove" | null;

type ProfilePhotoState = {
  /** Foto a exibir; `null` sem foto ou quando o link assinado falhou ao carregar. */
  photo: ProfilePhoto | null;
  pending: PendingAction;
  isBusy: boolean;
  /** Devolve `true` quando a foto foi salva. */
  upload: (candidate: File) => Promise<boolean>;
  /** Devolve `true` quando a foto foi removida. */
  remove: () => Promise<boolean>;
  markImageFailed: () => void;
};

/** Estado e ações da foto de perfil: validação, envio, remoção e avisos ao usuário. */
export function useProfilePhoto(initialPhoto: ProfilePhoto | null): ProfilePhotoState {
  const [photo, setPhoto] = useState(initialPhoto);
  const setSharedPhoto = useSetAtom(profilePhotoAtom);
  const [pending, setPending] = useState<PendingAction>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const isBusy = pending !== null;

  async function upload(candidate: File): Promise<boolean> {
    if (isBusy) return false;

    const parsed = profilePhotoFileSchema.safeParse(candidate);
    if (!parsed.success) {
      notifyValidation(parsed.error);
      return false;
    }

    setPending("upload");
    try {
      const saved = await uploadProfilePhoto(parsed.data);
      notifySuccess(photo ? "Foto de perfil atualizada." : "Foto de perfil adicionada.");
      setPhoto(saved);
      setSharedPhoto(saved);
      return true;
    } catch (failure) {
      notifyProfilePhotoError(failure);
      return false;
    } finally {
      setPending(null);
    }
  }

  async function remove() {
    setPending("remove");
    try {
      await removeProfilePhoto();
      setPhoto(null);
      setSharedPhoto(null);
      notifySuccess("Foto de perfil removida.");
      return true;
    } catch (failure) {
      notifyProfilePhotoError(failure);
      return false;
    } finally {
      setPending(null);
    }
  }

  return {
    photo: photo && photo.url !== failedUrl ? photo : null,
    pending,
    isBusy,
    upload,
    remove,
    markImageFailed: () => setFailedUrl(photo?.url ?? null),
  };
}
