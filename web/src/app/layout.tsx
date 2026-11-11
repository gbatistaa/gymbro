import type { Metadata } from "next";
import { AppProviders } from "@/providers/app-providers";

export const metadata: Metadata = {
  title: "Gymbro",
  description: "Seu caderno de treino.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
