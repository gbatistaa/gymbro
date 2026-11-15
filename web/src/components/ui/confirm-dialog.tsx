"use client";

import { useEffect, useId, useRef } from "react";
import { Button } from "./button";
import styles from "./ui.module.css";

type ConfirmDialogProps = {
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  isConfirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Diálogo de confirmação para ações destrutivas. Único por montagem: renderize apenas quando
 * aberto. O foco inicial fica em *cancelar* e `Esc` fecha.
 */
export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancelar",
  isConfirming = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={onCancel}
    >
      <h2 id={titleId} className={styles.dialogTitle}>
        {title}
      </h2>
      {description ? (
        <p id={descriptionId} className={styles.dialogText}>
          {description}
        </p>
      ) : null}

      <div className={styles.dialogActions}>
        <Button autoFocus variant="secondary" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button
          variant="danger"
          onClick={onConfirm}
          isLoading={isConfirming}
        >
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
