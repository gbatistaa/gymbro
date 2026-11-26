"use client";

import { Camera, Trash2 } from "lucide-react";
import Image from "next/image";
import { useId, useState, type ChangeEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  PROFILE_PHOTO_TYPES,
  profilePhotoFileSchema,
  type ProfilePhoto,
} from "@/contracts/user";
import { notifySuccess, notifyValidation } from "@/lib/notify";
import { notifyProfilePhotoError } from "./notify-profile-photo-error";
import { removeProfilePhoto, uploadProfilePhoto } from "./photo-api";
import styles from "./profile.module.css";

const AVATAR_SIZE = 72;
const ACCEPTED_TYPES = PROFILE_PHOTO_TYPES.join(",");

type PendingAction = "upload" | "remove" | null;

function initialsOf(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "?";
}

type ProfilePhotoEditorProps = {
  name: string;
  initialPhoto: ProfilePhoto | null;
  /** Identidade exibida ao lado do avatar. */
  children: ReactNode;
};

/** Avatar do perfil: toque para enviar ou trocar a foto; remover pede confirmação. */
export function ProfilePhotoEditor({ name, initialPhoto, children }: ProfilePhotoEditorProps) {
  const inputId = useId();
  const [photo, setPhoto] = useState(initialPhoto);
  const [pending, setPending] = useState<PendingAction>(null);
  const [isConfirmingRemoval, setIsConfirmingRemoval] = useState(false);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const isBusy = pending !== null;
  const visiblePhoto = photo && photo.url !== failedUrl ? photo : null;

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const candidate = event.target.files?.[0];
    // permite escolher o mesmo arquivo de novo depois de uma falha
    event.target.value = "";
    if (!candidate || isBusy) return;

    const parsed = profilePhotoFileSchema.safeParse(candidate);
    if (!parsed.success) {
      notifyValidation(parsed.error);
      return;
    }

    setPending("upload");
    try {
      const saved = await uploadProfilePhoto(parsed.data);
      notifySuccess(photo ? "Foto de perfil atualizada." : "Foto de perfil adicionada.");
      setPhoto(saved);
    } catch (failure) {
      notifyProfilePhotoError(failure);
    } finally {
      setPending(null);
    }
  }

  async function handleRemove() {
    setPending("remove");
    try {
      await removeProfilePhoto();
      setPhoto(null);
      setIsConfirmingRemoval(false);
      notifySuccess("Foto de perfil removida.");
    } catch (failure) {
      notifyProfilePhotoError(failure);
    } finally {
      setPending(null);
    }
  }

  return (
    <div className={styles.photoBlock}>
      <div className={styles.heroTop}>
        <div className={styles.avatarWrap}>
          <input
            id={inputId}
            type="file"
            accept={ACCEPTED_TYPES}
            className={styles.fileInput}
            disabled={isBusy}
            onChange={handleFileChange}
          />
          <label
            htmlFor={inputId}
            className={[styles.avatar, isBusy ? styles.avatarBusy : null].filter(Boolean).join(" ")}
            aria-busy={pending === "upload" || undefined}
          >
            {visiblePhoto ? (
              <Image
                src={visiblePhoto.url}
                alt=""
                width={AVATAR_SIZE}
                height={AVATAR_SIZE}
                // link assinado e temporário do bucket; GIF precisa chegar intacto para animar
                unoptimized
                className={styles.avatarImage}
                onError={() => setFailedUrl(visiblePhoto.url)}
              />
            ) : (
              <span aria-hidden="true">{initialsOf(name)}</span>
            )}
            <span className={styles.avatarBadge} aria-hidden="true">
              {pending === "upload" ? (
                <span className={styles.avatarSpinner} />
              ) : (
                <Camera size={14} strokeWidth={2} />
              )}
            </span>
            <span className={styles.srOnly}>
              {pending === "upload"
                ? "Enviando foto…"
                : photo
                  ? "Trocar foto de perfil"
                  : "Adicionar foto de perfil"}
            </span>
          </label>
        </div>
        {children}
      </div>

      <div className={styles.photoActions}>
        <span className={styles.photoHint}>PNG, JPEG, WEBP ou GIF · até 1 MB</span>
        {photo ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={isBusy}
            onClick={() => setIsConfirmingRemoval(true)}
          >
            <Trash2 size={14} strokeWidth={1.75} aria-hidden="true" />
            Remover foto
          </Button>
        ) : null}
      </div>

      {isConfirmingRemoval ? (
        <ConfirmDialog
          title="Remover foto de perfil?"
          description="Suas iniciais voltam a aparecer no lugar da foto."
          confirmLabel="Remover foto"
          isConfirming={pending === "remove"}
          onConfirm={handleRemove}
          onCancel={() => setIsConfirmingRemoval(false)}
        />
      ) : null}
    </div>
  );
}
