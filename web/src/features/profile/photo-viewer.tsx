"use client";

import { Pencil, Trash2, Upload, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useModalDialog } from "@/components/ui/use-modal-dialog";
import styles from "./profile.module.css";

type PhotoViewerProps = {
  url: string;
  isBusy: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onImageError: () => void;
};

/**
 * Foto grande em um modal quadrado, no estilo do WhatsApp. O lápis no canto superior direito abre
 * dois botões flutuantes: trocar a foto (abre o seletor de arquivos) e excluir.
 */
export function PhotoViewer({
  url,
  isBusy,
  onClose,
  onEdit,
  onDelete,
  onImageError,
}: PhotoViewerProps) {
  const { dialogRef, handleBackdropClick } = useModalDialog(onClose);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <dialog
      ref={dialogRef}
      className={styles.viewer}
      aria-label="Foto de perfil"
      onClose={onClose}
      onClick={handleBackdropClick}
    >
      <div className={styles.viewerFrame}>
        <Image
          src={url}
          alt="Foto de perfil"
          fill
          sizes="(max-width: 520px) 100vw, 480px"
          // link assinado e temporário do bucket; GIF precisa chegar intacto para animar
          unoptimized
          className={styles.viewerImage}
          onError={onImageError}
        />

        {isBusy ? (
          <div className={styles.viewerBusy} role="status" aria-label="Enviando foto…">
            <span className={styles.avatarSpinner} />
          </div>
        ) : null}

        <div className={styles.viewerTools}>
          {isMenuOpen ? (
            <>
              <button
                type="button"
                className={styles.viewerFab}
                aria-label="Trocar foto"
                disabled={isBusy}
                onClick={onEdit}
              >
                <Upload size={18} strokeWidth={1.75} aria-hidden="true" />
              </button>
              <button
                type="button"
                className={[styles.viewerFab, styles.viewerFabDanger].join(" ")}
                aria-label="Excluir foto"
                disabled={isBusy}
                onClick={onDelete}
              >
                <Trash2 size={18} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </>
          ) : null}
          <button
            type="button"
            className={styles.viewerFab}
            aria-label={isMenuOpen ? "Ocultar ações" : "Editar foto"}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            {isMenuOpen ? (
              <X size={18} strokeWidth={1.75} aria-hidden="true" />
            ) : (
              <Pencil size={18} strokeWidth={1.75} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </dialog>
  );
}
