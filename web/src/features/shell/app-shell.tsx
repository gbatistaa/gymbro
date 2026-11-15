"use client";

import type { ReactNode } from "react";
import { BottomNav } from "./bottom-nav";
import styles from "./shell.module.css";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#conteudo">
        Pular para o conteúdo
      </a>

      <BottomNav />

      <div className={styles.content}>
        <main id="conteudo" className={styles.main} tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
