"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { playlistSchema } from "@/contracts/playlist";
import { describeApiError } from "@/lib/api-error-text";
import { request } from "@/lib/http";
import styles from "./train.module.css";

type NewPlaylistFormProps = {
  onCreated: (playlistId: string) => void;
  onCancel: () => void;
};

export function NewPlaylistForm({
  onCreated,
  onCancel,
}: NewPlaylistFormProps) {
  const [name, setName] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const trimmed = name.trim();
    if (!trimmed) {
      setFieldError("Informe o nome da rotina.");
      return;
    }

    setFieldError(null);
    setFormError(null);
    setIsSubmitting(true);

    try {
      const playlist = await request(
        { method: "POST", url: "/api/playlists", data: { name: trimmed } },
        playlistSchema,
      );
      onCreated(playlist.id);
    } catch (failure) {
      setFormError(describeApiError(failure));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className={styles.newForm} onSubmit={handleSubmit} noValidate>
      {formError ? <Notice tone="error">{formError}</Notice> : null}

      <Field
        id="playlist-name"
        label="Nome da rotina"
        hint="Até 120 caracteres"
        maxLength={120}
        autoFocus
        value={name}
        error={fieldError ?? undefined}
        onChange={(event) => {
          setName(event.target.value);
          if (fieldError) setFieldError(null);
        }}
      />

      <div className={styles.formActions}>
        <Button type="submit" isLoading={isSubmitting}>
          Criar rotina
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
