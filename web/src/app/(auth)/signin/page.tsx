import type { Metadata } from "next";
import { SignInForm } from "@/features/auth/sign-in-form";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Acesse sua conta Gymbro.",
};

export const instant = false;

type SignInPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;

  return <SignInForm next={params.next} />;
}
