import type { ReactNode } from "react";
import styles from "./auth.module.css";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className={styles.page}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.frame}>
        <header className={styles.brandRail}>
          <span className={styles.wordmark}>GYMBRO</span>

          <div className={styles.brandCopy}>
            <p className={styles.kicker}>Caderno de treino</p>
            <p className={styles.statement}>
              Registre a série.
              <span>Decida a próxima.</span>
            </p>
          </div>

          <p className={styles.railMeta}>
            <span>PT-BR</span>
            <span>kg</span>
            <span>PWA</span>
          </p>
        </header>

        <section className={styles.panel}>{children}</section>
      </div>
    </main>
  );
}
