import { Camera } from "lucide-react";
import Image from "next/image";
import { initialsOf } from "@/lib/initials";
import styles from "./profile.module.css";

const AVATAR_SIZE = 72;

type ProfileAvatarProps = {
  name: string;
  photoUrl: string | null;
  isBusy: boolean;
  isUploading: boolean;
  onClick: () => void;
  onImageError: () => void;
};

/** Botão circular do perfil: foto, ou iniciais com o selo de câmera quando não há foto. */
export function ProfileAvatar({
  name,
  photoUrl,
  isBusy,
  isUploading,
  onClick,
  onImageError,
}: ProfileAvatarProps) {
  return (
    <button
      type="button"
      className={[styles.avatar, isBusy ? styles.avatarBusy : null].filter(Boolean).join(" ")}
      aria-busy={isUploading || undefined}
      aria-label={photoUrl ? "Ver foto de perfil" : "Adicionar foto de perfil"}
      onClick={onClick}
    >
      {photoUrl ? (
        <Image
          src={photoUrl}
          alt=""
          width={AVATAR_SIZE}
          height={AVATAR_SIZE}
          // link assinado e temporário do bucket; GIF precisa chegar intacto para animar
          unoptimized
          className={styles.avatarImage}
          onError={onImageError}
        />
      ) : (
        <>
          <span aria-hidden="true">{initialsOf(name)}</span>
          <span className={styles.avatarBadge} aria-hidden="true">
            {isUploading ? <span className={styles.avatarSpinner} /> : <Camera size={14} strokeWidth={2} />}
          </span>
        </>
      )}
    </button>
  );
}
