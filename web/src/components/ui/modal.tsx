"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import styles from "./ui.module.css";

type ModalProps = {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
};

/**
 * Diálogo modal genérico, aberto com `showModal()` (foco preso, `Esc` fecha). Único por montagem:
 * renderize apenas quando aberto; o pai controla o estado com `onClose`.
 */
export function Modal({ title, description, onClose, children }: ModalProps) {
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
      onClose={onClose}
    >
      <h2 id={titleId} className={styles.dialogTitle}>
        {title}
      </h2>
      {description ? (
        <p id={descriptionId} className={styles.dialogText}>
          {description}
        </p>
      ) : null}
      {children}
    </dialog>
  );
}
