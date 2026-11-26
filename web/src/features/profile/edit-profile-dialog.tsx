"use client";

import axios from "axios";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Notice } from "@/components/ui/notice";
import { SelectField } from "@/components/ui/select-field";
import { apiErrorSchema } from "@/contracts/api-error";
import { userSummarySchema, type UserSummary } from "@/contracts/auth";
import { profileFormSchema, type ProfileFormInput } from "@/contracts/user";
import { describeApiError } from "@/lib/api-error-text";
import { request } from "@/lib/http";
import { timeZoneOptionsWithCurrent } from "@/lib/timezones";
import styles from "./profile.module.css";

type ProfileField = keyof ProfileFormInput;
type FieldErrors = Partial<Record<ProfileField, string>>;

const PROFILE_FIELDS: readonly ProfileField[] = ["name", "email", "timezone"];

function isProfileField(value: PropertyKey | undefined): value is ProfileField {
  return PROFILE_FIELDS.some((field) => field === value);
}

/** `409` de e-mail já usado chega com `errors[].field`; cada mensagem vai para o campo certo. */
function apiFieldErrors(failure: unknown): FieldErrors {
  if (!axios.isAxiosError(failure)) return {};

  const parsed = apiErrorSchema.safeParse(failure.response?.data);
  if (!parsed.success) return {};

  const result: FieldErrors = {};
  for (const fieldError of parsed.data.errors) {
    const field = fieldError.field;
    if (isProfileField(field)) {
      result[field] = fieldError.message;
    }
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
  const [timezone, setTimezone] = useState(user.timezone);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const timezoneOptions = timeZoneOptionsWithCurrent(user.timezone);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    const parsed = profileFormSchema.safeParse({ name, email, timezone });
    if (!parsed.success) {
      const localErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (isProfileField(field) && localErrors[field] === undefined) {
          localErrors[field] = issue.message;
        }
      }
      setFormError(null);
      setFieldErrors(localErrors);
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setIsSaving(true);

    try {
      const saved = await request(
        { method: "PUT", url: "/api/users/me", data: parsed.data },
        userSummarySchema,
      );
      onSaved(saved);
    } catch (failure) {
      const serverErrors = apiFieldErrors(failure);
      if (Object.keys(serverErrors).length > 0) {
        setFieldErrors(serverErrors);
      } else {
        setFormError(describeApiError(failure));
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal
      title="Editar informações"
      description="Nome, e-mail e fuso horário. Usuário e senha têm fluxos próprios."
      onClose={onClose}
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <Field
          id="profile-name"
          label="Nome"
          autoComplete="name"
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

        <SelectField
          id="profile-timezone"
          label="Fuso horário"
          value={timezone}
          onChange={(event) => setTimezone(event.target.value)}
          error={fieldErrors.timezone}
        >
          {timezoneOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>

        {formError ? <Notice tone="error">{formError}</Notice> : null}

        <div className={styles.actions}>
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSaving}>
            Salvar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
