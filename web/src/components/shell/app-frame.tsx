import { Suspense, type ReactNode } from "react";
import { SessionGuard } from "@/features/shell/session-guard";
import { BottomNav } from "./bottom-nav";
import styles from "./shell.module.css";
import { TopBar } from "./top-bar";

type AppFrameProps = {
  children: ReactNode;
};

export function AppFrame({ children }: AppFrameProps) {
  return (
    <SessionGuard>
      <div className={`${styles.shell} bg-bg text-text`}>
        <a className={styles.skipLink} href="#conteudo">
          Pular para o conteúdo
        </a>

        <TopBar />

        <main id="conteudo" className={styles.main} tabIndex={-1}>
          {children}
        </main>

        <Suspense fallback={null}>
          <BottomNav />
        </Suspense>
      </div>
    </SessionGuard>
  );
}
