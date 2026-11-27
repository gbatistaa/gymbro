"use client";

import { useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PROFILE_PHOTO_TYPES, type ProfilePhoto } from "@/contracts/user";
import { notifyErrors, notifyInfo } from "@/lib/notify";
import { PhotoViewer } from "./photo-viewer";
import { ProfileAvatar } from "./profile-avatar";
import styles from "./profile.module.css";
import { useProfilePhoto } from "./use-profile-photo";

const ACCEPTED_TYPES = PROFILE_PHOTO_TYPES.join(",");
const PHOTO_FORMAT_HINT = "Formatos aceitos: PNG, JPEG, WEBP ou GIF · até 1 MB.";

type ProfilePhotoEditorProps = {
  name: string;
  initialPhoto: ProfilePhoto | null;
  /** Identidade exibida ao lado do avatar. */
  children: ReactNode;
};

/**
 * Avatar do perfil. Sem foto, tocar abre o seletor de arquivos; com foto, abre a foto grande, de onde
 * se troca ou exclui (a exclusão pede confirmação).
 */
export function ProfilePhotoEditor({ name, initialPhoto, children }: ProfilePhotoEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { photo, pending, isBusy, upload, remove, markImageFailed } =
    useProfilePhoto(initialPhoto);
  const [isViewing, setIsViewing] = useState(false);
  const [isConfirmingRemoval, setIsConfirmingRemoval] = useState(false);

  function openFilePicker() {
    notifyInfo(PHOTO_FORMAT_HINT);
    inputRef.current?.click();
  }

  function handleAvatarClick() {
    if (isBusy) return;
    if (photo) {
      setIsViewing(true);
    } else {
      openFilePicker();
    }
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const candidate = event.target.files?.[0];
    // permite escolher o mesmo arquivo de novo depois de uma falha
    event.target.value = "";
    if (!candidate) return;

    const isSaved = await upload(candidate);
    // falha ao colocar a imagem: o preview fecha e o toast de erro já foi mostrado
    if (!isSaved) setIsViewing(false);
  }

  function handleViewerImageError() {
    setIsViewing(false);
    markImageFailed();
    notifyErrors(["Não foi possível carregar a foto de perfil."]);
  }

  async function handleRemove() {
    if (await remove()) {
      setIsViewing(false);
      setIsConfirmingRemoval(false);
    }
  }

  return (
    <div className={styles.photoBlock}>
      <div className={styles.heroTop}>
        <div className={styles.avatarWrap}>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            className={styles.fileInput}
            disabled={isBusy}
            tabIndex={-1}
            aria-hidden="true"
            onChange={handleFileChange}
          />
          <ProfileAvatar
            name={name}
            photoUrl={photo?.url ?? null}
            isBusy={isBusy}
            isUploading={pending === "upload"}
            onClick={handleAvatarClick}
            onImageError={markImageFailed}
          />
        </div>
        {children}
      </div>

      {isViewing && photo ? (
        <PhotoViewer
          url={photo.url}
          isBusy={isBusy}
          onClose={() => setIsViewing(false)}
          onEdit={openFilePicker}
          onDelete={() => setIsConfirmingRemoval(true)}
          onImageError={handleViewerImageError}
        />
      ) : null}

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
