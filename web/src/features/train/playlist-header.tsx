"use client";

import { Pencil } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { playlistSchema, type PlaylistDetail } from "@/contracts/playlist";
import { formatCount } from "@/lib/format";
import { request } from "@/lib/http";
import { notifyApiError, notifyErrors } from "@/lib/notify";
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
  const [isSaving, setIsSaving] = useState(false);

  const count = playlist.exercises.length;

  function openEditor() {
    setName(playlist.name);
    setDescription(playlist.description ?? "");
    setNameError(null);
    setDescriptionError(null);
    setIsEditing(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const messages: string[] = [];

    if (!trimmedName) {
      const message = "Informe o nome da rotina.";
      setNameError(message);
      messages.push(message);
    } else if (trimmedName.length > 120) {
      const message = "Use no máximo 120 caracteres.";
      setNameError(message);
      messages.push(message);
    }

    if (trimmedDescription.length > 500) {
      const message = "Use no máximo 500 caracteres.";
      setDescriptionError(message);
      messages.push(message);
    }

    if (messages.length > 0) {
      notifyErrors(messages);
      return;
    }

    setNameError(null);
    setDescriptionError(null);
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
      notifyApiError(failure);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <header className={styles.headerBlock}>
      <div className={styles.headerTop}>
        <div className={styles.headerMain}>
          <div className={styles.headerBadges}>
            <Badge tone="primary">
              {formatCount(count)} {count === 1 ? "exercício" : "exercícios"}
            </Badge>
          </div>
          <h1 className={styles.headerName}>{playlist.name}</h1>
        </div>

        <Button variant="secondary" size="sm" onClick={openEditor}>
          <Pencil size={14} aria-hidden="true" />
          Editar
        </Button>
      </div>

      {playlist.description ? (
        <p className={styles.headerDescription}>{playlist.description}</p>
      ) : null}

      {isEditing ? (
        <Modal
          title="Editar ficha"
          description="Altere o nome ou a descrição desta ficha de treino."
          onClose={() => setIsEditing(false)}
          footer={
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                form="playlist-edit-form"
                isLoading={isSaving}
              >
                Salvar alterações
              </Button>
            </>
          }
        >
          <form
            id="playlist-edit-form"
            className={styles.modalForm}
            onSubmit={handleSubmit}
            noValidate
          >
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
          </form>
        </Modal>
      ) : null}
    </header>
  );
}
