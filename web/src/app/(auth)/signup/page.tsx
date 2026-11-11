import type { Metadata } from "next";
import { SignUpForm } from "@/features/auth/sign-up-form";

export const metadata: Metadata = {
  title: "Criar conta",
  description: "Crie sua conta Gymbro.",
};

export const instant = false;

type SignUpPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;

  return <SignUpForm next={params.next} />;
}
