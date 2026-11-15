import type { ReactNode } from "react";
import { AppShell } from "@/features/shell/app-shell";
import { SessionGuard } from "@/features/shell/session-guard";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SessionGuard>
      <AppShell>{children}</AppShell>
    </SessionGuard>
  );
}
