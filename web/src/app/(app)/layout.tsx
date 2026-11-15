import type { ReactNode } from "react";
import { AppFrame } from "@/components/shell/app-frame";
import { HOME_MOCK_DATA } from "@/lib/mock-data";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AppFrame userInitials={HOME_MOCK_DATA.userInitials}>{children}</AppFrame>
  );
}
