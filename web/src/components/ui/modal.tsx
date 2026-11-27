"use client";

import { X } from "lucide-react";
import { useId, type ReactNode } from "react";
import { useModalDialog } from "./use-modal-dialog";
import styles from "./ui.module.css";

type ModalSize = "default" | "large";

type ModalProps = {
  title: string;
  description?: string;
  size?: ModalSize;
  onClose: () => void;
  /** Scrollable content. */
  children: ReactNode;
  /** Fixed action bar. Submit buttons can target a form in the body with `form="<id>"`. */
  footer?: ReactNode;
};

/**
 * A real modal: opened with `showModal()` in the top layer, over a dimmed and blurred page. It
 * becomes a bottom sheet on small screens. `Esc`, the close button and a click outside close it,
 * and the page behind stops scrolling. Render it only while open; the parent owns the state.
 */
export function Modal({
  title,
  description,
  size = "default",
  onClose,
  children,
  footer,
}: ModalProps) {
  const { dialogRef, handleBackdropClick } = useModalDialog(onClose);
  const titleId = useId();
  const descriptionId = useId();

  return (
    <dialog
      ref={dialogRef}
      className={[styles.modal, size === "large" ? styles.modalLarge : null]
        .filter(Boolean)
        .join(" ")}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={onClose}
      onClick={handleBackdropClick}
    >
      <div className={styles.modalSheetGrip} aria-hidden="true">
        <span className={styles.modalSheetBar} />
      </div>

      <header className={styles.modalHeader}>
        <div>
          <h2 id={titleId} className={styles.modalTitle}>
            {title}
          </h2>
          {description ? (
            <p id={descriptionId} className={styles.modalDescription}>
              {description}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          className={styles.modalClose}
          aria-label="Fechar"
          onClick={onClose}
        >
          <X size={18} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </header>

      <div className={styles.modalBody}>{children}</div>

      {footer ? <footer className={styles.modalFooter}>{footer}</footer> : null}
    </dialog>
  );
}
