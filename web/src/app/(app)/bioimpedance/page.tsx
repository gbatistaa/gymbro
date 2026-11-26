import type { Metadata } from "next";
import { BioimpedanceScreen } from "@/features/bioimpedance/bioimpedance-screen";

export const metadata: Metadata = {
  title: "Bioimpedância",
};

// a tela só renderiza depois de o SessionGuard validar a sessão no cliente
export const instant = false;

export default function BioimpedancePage() {
  return <BioimpedanceScreen />;
}
