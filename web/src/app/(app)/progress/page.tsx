import type { Metadata } from "next";
import { ProgressScreen } from "@/features/progress/progress-screen";

export const metadata: Metadata = {
  title: "Progresso",
};

export default function ProgressPage() {
  return <ProgressScreen />;
}
