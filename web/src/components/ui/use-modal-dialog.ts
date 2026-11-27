"use client";

import { useEffect, useRef, type MouseEvent, type RefObject } from "react";

type ModalDialog = {
  dialogRef: RefObject<HTMLDialogElement | null>;
  /** Fecha ao clicar no fundo escurecido (o alvo do clique é o próprio `<dialog>`). */
  handleBackdropClick: (event: MouseEvent<HTMLDialogElement>) => void;
};

/**
 * Comportamento comum dos modais: abre o `<dialog>` na camada superior com `showModal()` e trava a
 * rolagem da página enquanto ele existir. Renderize o modal só enquanto aberto.
 */
export function useModalDialog(onClose: () => void): ModalDialog {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }

    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";

    return () => {
      root.style.overflow = previousOverflow;
    };
  }, []);

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return { dialogRef, handleBackdropClick };
}
