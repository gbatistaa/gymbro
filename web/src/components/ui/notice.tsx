import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./ui.module.css";

/** Aviso de erro fixo na tela, para falhas de carregamento. Confirmações e erros de ação usam toast. */
export function Notice({ children }: { children: ReactNode }) {
  return (
    <div className={`${styles.notice} ${styles.noticeError}`} role="alert">
      <AlertCircle size={18} aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}
