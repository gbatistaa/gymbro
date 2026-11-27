"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { userSummarySchema, type UserSummary } from "@/contracts/auth";
import { profileFormSchema, type ProfileFormInput } from "@/contracts/user";
import { apiFieldMessages } from "@/lib/api-error-text";
import { request } from "@/lib/http";
import { notifyApiError, notifyValidation } from "@/lib/notify";
import styles from "./profile.module.css";

const FORM_ID = "edit-profile-form";

type ProfileField = keyof ProfileFormInput;
type FieldErrors = Partial<Record<ProfileField, string>>;

const PROFILE_FIELDS: readonly ProfileField[] = ["name", "email"];

function isProfileField(value: PropertyKey | undefined): value is ProfileField {
  return PROFILE_FIELDS.some((field) => field === value);
}

/** Cada campo recebe a mensagem exata que o backend enviou para ele. */
function serverFieldErrors(failure: unknown): FieldErrors {
  const result: FieldErrors = {};
  for (const { field, message } of apiFieldMessages(failure)) {
    if (isProfileField(field)) result[field] ??= message;
  }
  return result;
}

type EditProfileDialogProps = {
  user: UserSummary;
  onSaved: (user: UserSummary) => void;
  onClose: () => void;
};

export function EditProfileDialog({ user, onSaved, onClose }: EditProfileDialogProps) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    // o fuso é lógica interna: segue o valor atual do usuário, sem campo na tela
    const parsed = profileFormSchema.safeParse({ name, email, timezone: user.timezone });
    if (!parsed.success) {
      const localErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (isProfileField(field) && localErrors[field] === undefined) {
          localErrors[field] = issue.message;
        }
      }
      setFieldErrors(localErrors);
      notifyValidation(parsed.error);
      return;
    }

    setFieldErrors({});
    setIsSaving(true);

    try {
      const saved = await request(
        { method: "PUT", url: "/api/users/me", data: parsed.data },
        userSummarySchema,
      );
      onSaved(saved);
    } catch (failure) {
      setFieldErrors(serverFieldErrors(failure));
      notifyApiError(failure);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal
      title="Editar informações"
      description="Atualize seu nome e e-mail."
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="submit" form={FORM_ID} isLoading={isSaving}>
            Salvar alterações
          </Button>
        </>
      }
    >
      <form id={FORM_ID} className={styles.form} onSubmit={handleSubmit} noValidate>
        <Field
          id="profile-name"
          label="Nome completo"
          autoComplete="name"
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={fieldErrors.name}
        />

        <Field
          id="profile-email"
          label="E-mail"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={fieldErrors.email}
        />
      </form>
    </Modal>
  );
}
