"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { signUpSchema, type SignUpInput } from "@/contracts/auth";
import { register } from "./api";
import styles from "./components/auth.module.css";
import { AuthField } from "./components/auth-field";
import { AuthHeader } from "./components/auth-header";
import { AuthNotice } from "./components/auth-notice";
import { AuthSubmit } from "./components/auth-submit";
import { AuthSwitch } from "./components/auth-switch";
import { describeAuthError, toFieldErrors, type FieldErrors } from "./errors";

type SignUpFormProps = {
  next?: string;
};

export function SignUpForm({ next }: SignUpFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<SignUpInput>({
    name: "",
    email: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const signInHref = next
    ? `/signin?next=${encodeURIComponent(next)}`
    : "/signin";

  function setField(field: keyof SignUpInput, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) =>
      current[field] ? { ...current, [field]: undefined } : current,
    );
    if (formError) setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const parsed = signUpSchema.safeParse(values);
    if (!parsed.success) {
      setFieldErrors(toFieldErrors(parsed.error));
      setFormError(null);
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setIsSubmitting(true);

    try {
      await register(parsed.data);
      const params = new URLSearchParams({ registered: "1" });
      if (next) params.set("next", next);
      router.replace(`/signin?${params.toString()}`);
    } catch (error) {
      const described = describeAuthError(error);
      setFieldErrors(described.fields);
      setFormError(described.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <AuthHeader
        eyebrow="Criar conta"
        title="Comece seu caderno"
        description="Um cadastro curto para registrar o treino de hoje."
      />

      {formError ? <AuthNotice tone="danger">{formError}</AuthNotice> : null}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <AuthField
          id="signup-name"
          name="name"
          label="Nome"
          autoComplete="name"
          value={values.name}
          error={fieldErrors.name}
          onChange={(value) => setField("name", value)}
        />

        <AuthField
          id="signup-email"
          name="email"
          label="E-mail"
          type="email"
          autoComplete="email"
          value={values.email}
          error={fieldErrors.email}
          onChange={(value) => setField("email", value)}
        />

        <AuthField
          id="signup-password"
          name="password"
          label="Senha"
          type="password"
          autoComplete="new-password"
          hint="Mínimo 8 caracteres"
          value={values.password}
          error={fieldErrors.password}
          onChange={(value) => setField("password", value)}
        />

        <AuthSubmit
          isSubmitting={isSubmitting}
          idleLabel="Criar conta"
          busyLabel="Criando conta"
        />
      </form>

      <AuthSwitch
        prompt="Já possui conta?"
        href={signInHref}
        label="Entrar"
      />
    </>
  );
}
