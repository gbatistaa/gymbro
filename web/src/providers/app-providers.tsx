"use client";

import { Provider, useSetAtom } from "jotai";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { setUnauthorizedHandler } from "@/lib/http";
import { sessionAtom } from "@/stores/session";

function UnauthorizedHandler() {
  const router = useRouter();
  const setSession = useSetAtom(sessionAtom);

  useEffect(() => {
    setUnauthorizedHandler((next) => {
      setSession(null);
      router.replace(`/signin?next=${encodeURIComponent(next)}`);
    });

    return () => setUnauthorizedHandler(null);
  }, [router, setSession]);

  return null;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <Provider>
      <UnauthorizedHandler />
      {children}
    </Provider>
  );
}
