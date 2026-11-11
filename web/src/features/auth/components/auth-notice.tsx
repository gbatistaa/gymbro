import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./auth.module.css";

export function AuthNotice({ children }: { children: ReactNode }) {
  return (
    <div className={`${styles.notice} ${styles.noticeDanger}`} role="alert">
      <AlertCircle size={18} aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}
