"use client";

import { useSetAtom } from "jotai";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { userSummarySchema } from "@/contracts/auth";
import { request } from "@/lib/http";
import { sessionAtom } from "@/stores/session";
import styles from "./shell.module.css";

type GuardState = "checking" | "ready" | "leaving";

/**
 * Nenhum conteúdo privado renderiza antes de `GET /api/users/me` confirmar a sessão.
 * A autorização real continua no backend; isto evita flash de tela privada e hidrata o usuário.
 */
export function SessionGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const setSession = useSetAtom(sessionAtom);
  const [state, setState] = useState<GuardState>("checking");

  useEffect(() => {
    let ignore = false;

    request({ method: "GET", url: "/api/users/me" }, userSummarySchema).then(
      (user) => {
        if (ignore) return;
        // Sobrescreve qualquer estado legado, inclusive o antigo `{ tokens, user }`.
        setSession({ user });
        setState("ready");
      },
      () => {
        if (ignore) return;
        setSession(null);
        setState("leaving");
        const { pathname, search } = window.location;
        router.replace(`/signin?next=${encodeURIComponent(pathname + search)}`);
      },
    );

    return () => {
      ignore = true;
    };
  }, [router, setSession]);

  if (state !== "ready") {
    return (
      <main className={styles.guard} aria-busy="true">
        <span className={styles.guardWordmark}>GYMBRO</span>
        <span className={styles.guardText}>Validando sessão…</span>
      </main>
    );
  }

  return <>{children}</>;
}
