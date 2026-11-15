import { Suspense, type ReactNode } from "react";
import { BottomNav } from "./bottom-nav";
import styles from "./shell.module.css";
import { TopBar } from "./top-bar";

type AppFrameProps = {
  children: ReactNode;
  userInitials?: string;
};

export function AppFrame({ children, userInitials = "FL" }: AppFrameProps) {
  return (
    <div className={`${styles.shell} bg-bg text-text`}>
      <a className={styles.skipLink} href="#conteudo">
        Pular para o conteúdo
      </a>

      <TopBar userInitials={userInitials} />

      <main id="conteudo" className={styles.main} tabIndex={-1}>
        {children}
      </main>

      <Suspense fallback={null}>
        <BottomNav />
      </Suspense>
    </div>
  );
}
