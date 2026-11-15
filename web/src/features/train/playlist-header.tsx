"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { playlistSchema, type PlaylistDetail } from "@/contracts/playlist";
import { describeApiError } from "@/lib/api-error-text";
import { formatCount } from "@/lib/format";
import { request } from "@/lib/http";
import styles from "./train.module.css";

type PlaylistHeaderProps = {
  playlist: PlaylistDetail;
  onSaved: () => void;
};

export function PlaylistHeader({ playlist, onSaved }: PlaylistHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(playlist.name);
  const [description, setDescription] = useState(playlist.description ?? "");
  const [nameError, setNameError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isArchived = playlist.archivedAt != null;
  const count = playlist.exercises.length;

  function openEditor() {
    setName(playlist.name);
    setDescription(playlist.description ?? "");
    setNameError(null);
    setDescriptionError(null);
    setFormError(null);
    setIsEditing(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    let hasError = false;

    if (!trimmedName) {
      setNameError("Informe o nome da rotina.");
      hasError = true;
    } else if (trimmedName.length > 120) {
      setNameError("Use no máximo 120 caracteres.");
      hasError = true;
    }

    if (trimmedDescription.length > 500) {
      setDescriptionError("Use no máximo 500 caracteres.");
      hasError = true;
    }

    if (hasError) return;

    setNameError(null);
    setDescriptionError(null);
    setFormError(null);
    setIsSaving(true);

    try {
      await request(
        {
          method: "PUT",
          url: `/api/playlists/${playlist.id}`,
          data: { name: trimmedName, description: trimmedDescription },
        },
        playlistSchema,
      );
      setIsEditing(false);
      onSaved();
    } catch (failure) {
      setFormError(describeApiError(failure));
    } finally {
      setIsSaving(false);
    }
  }

  if (isEditing) {
    return (
      <form className={styles.newForm} onSubmit={handleSubmit} noValidate>
        {formError ? <Notice tone="error">{formError}</Notice> : null}

        <Field
          id="playlist-edit-name"
          label="Nome da rotina"
          hint="Até 120 caracteres"
          maxLength={120}
          autoFocus
          required
          value={name}
          error={nameError ?? undefined}
          onChange={(event) => {
            setName(event.target.value);
            if (nameError) setNameError(null);
          }}
        />

        <Field
          id="playlist-edit-description"
          label="Descrição"
          hint="Opcional, até 500 caracteres"
          maxLength={500}
          value={description}
          error={descriptionError ?? undefined}
          onChange={(event) => {
            setDescription(event.target.value);
            if (descriptionError) setDescriptionError(null);
          }}
        />

        <div className={styles.formActions}>
          <Button type="submit" isLoading={isSaving}>
            Salvar
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsEditing(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
        </div>
      </form>
    );
  }

  return (
    <header className={styles.headerBlock}>
      <div className={styles.headerTop}>
        <h1 className={styles.headerName}>{playlist.name}</h1>
        {isArchived ? null : (
          <Button variant="ghost" onClick={openEditor}>
            Editar rotina
          </Button>
        )}
      </div>

      {playlist.description ? (
        <p className={styles.headerDescription}>{playlist.description}</p>
      ) : null}

      <p className={styles.headerMeta}>
        {formatCount(count)} {count === 1 ? "exercício" : "exercícios"}
        {isArchived ? " · arquivada" : ""}
      </p>
    </header>
  );
}
