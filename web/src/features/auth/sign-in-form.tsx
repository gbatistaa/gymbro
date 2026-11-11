"use client";

import { useSetAtom } from "jotai";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { loginSchema, type LoginInput } from "@/contracts/auth";
import { sessionAtom } from "@/stores/session";
import { login } from "./api";
import styles from "./components/auth.module.css";
import { AuthField } from "./components/auth-field";
import { AuthHeader } from "./components/auth-header";
import { AuthNotice } from "./components/auth-notice";
import { AuthSubmit } from "./components/auth-submit";
import { AuthSwitch } from "./components/auth-switch";
import { describeAuthError, toFieldErrors, type FieldErrors } from "./errors";
import { safeNextPath } from "./next-path";

type SignInFormProps = {
  next?: string;
};

export function SignInForm({ next }: SignInFormProps) {
  const router = useRouter();
  const setSession = useSetAtom(sessionAtom);
  const destination = safeNextPath(next);
  const [values, setValues] = useState<LoginInput>({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const signUpHref =
    destination !== "/"
      ? `/signup?next=${encodeURIComponent(destination)}`
      : "/signup";

  function setField(field: keyof LoginInput, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) =>
      current[field] ? { ...current, [field]: undefined } : current,
    );
    if (formError) setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      setFieldErrors(toFieldErrors(parsed.error));
      setFormError(null);
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setIsSubmitting(true);

    try {
      const user = await login(parsed.data);
      setSession({ user });
      router.replace(destination);
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
        eyebrow="Acessar"
        title="Entrar no Gymbro"
        description="Volte ao seu caderno e registre o treino de hoje."
      />

      {formError ? <AuthNotice>{formError}</AuthNotice> : null}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <AuthField
          id="signin-email"
          name="email"
          label="E-mail"
          type="email"
          autoComplete="email"
          value={values.email}
          error={fieldErrors.email}
          onChange={(value) => setField("email", value)}
        />

        <AuthField
          id="signin-password"
          name="password"
          label="Senha"
          type="password"
          autoComplete="current-password"
          value={values.password}
          error={fieldErrors.password}
          onChange={(value) => setField("password", value)}
        />

        <AuthSubmit
          isSubmitting={isSubmitting}
          idleLabel="Entrar"
          busyLabel="Entrando"
        />
      </form>

      <AuthSwitch
        prompt="Ainda não possui conta?"
        href={signUpHref}
        label="Criar conta"
      />
    </>
  );
}
