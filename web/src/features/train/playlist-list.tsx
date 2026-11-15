"use client";

import axios from "axios";
import { useAtomValue } from "jotai";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Notice } from "@/components/ui/notice";
import { SectionLabel } from "@/components/ui/section-label";
import { Skeleton } from "@/components/ui/skeleton";
import { playlistSchema, playlistSummarySchema, type PlaylistSummary } from "@/contracts/playlist";
import { sessionSchema } from "@/contracts/session";
import { describeApiError } from "@/lib/api-error-text";
import { formatCount, formatRelative } from "@/lib/format";
import { request, requestMaybe } from "@/lib/http";
import { useResource } from "@/lib/use-resource";
import { sessionAtom } from "@/stores/session";
import { NewPlaylistForm } from "./new-playlist-form";
import styles from "./train.module.css";

function exerciseCountLabel(count: number): string {
  return `${formatCount(count)} ${count === 1 ? "exercício" : "exercícios"}`;
}

export function PlaylistList() {
  const router = useRouter();
  const user = useAtomValue(sessionAtom)?.user;
  const timezone =
    user?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

  const [showArchived, setShowArchived] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<PlaylistSummary | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  const { data, error, isLoading, reload } = useResource(
    `playlists:${showArchived}`,
    () =>
      request(
        {
          url: "/api/playlists",
          params: { includeArchived: showArchived },
        },
        playlistSummarySchema.array(),
      ),
  );

  function clearNotices() {
    setActionError(null);
    setActiveSessionId(null);
  }

  async function startRoutine(routine: PlaylistSummary) {
    if (busyKey) return;

    clearNotices();
    setBusyKey(`start:${routine.id}`);

    try {
      const session = await request(
        {
          method: "POST",
          url: "/api/sessions",
          data: { playlistId: routine.id },
        },
        sessionSchema,
      );
      router.push(`/train/sessions/${session.id}`);
    } catch (failure) {
      if (axios.isAxiosError(failure) && failure.response?.status === 409) {
        const active = await requestMaybe(
          { url: "/api/sessions/active" },
          sessionSchema,
        ).catch(() => null);

        if (active) {
          setActiveSessionId(active.id);
        } else {
          setActionError("Você já tem uma sessão em andamento.");
        }
      } else {
        setActionError(describeApiError(failure));
      }
    } finally {
      setBusyKey(null);
    }
  }

  async function duplicateRoutine(routine: PlaylistSummary) {
    if (busyKey) return;

    clearNotices();
    setBusyKey(`clone:${routine.id}`);

    try {
      await request(
        { method: "POST", url: `/api/playlists/${routine.id}/clone` },
        playlistSchema,
      );
      reload();
    } catch (failure) {
      setActionError(describeApiError(failure));
    } finally {
      setBusyKey(null);
    }
  }

  async function archiveRoutine() {
    if (!archiveTarget || isArchiving) return;

    clearNotices();
    setIsArchiving(true);

    try {
      await request(
        { method: "POST", url: `/api/playlists/${archiveTarget.id}/archive` },
        playlistSchema,
      );
      setArchiveTarget(null);
      reload();
    } catch (failure) {
      setArchiveTarget(null);
      setActionError(describeApiError(failure));
    } finally {
      setIsArchiving(false);
    }
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>Treinar</h1>
        {isFormOpen ? null : (
          <Button onClick={() => setIsFormOpen(true)}>Nova rotina</Button>
        )}
      </header>

      {isFormOpen ? (
        <NewPlaylistForm
          onCreated={(playlistId) => router.push(`/train/playlists/${playlistId}`)}
          onCancel={() => setIsFormOpen(false)}
        />
      ) : null}

      {activeSessionId ? (
        <Notice tone="info">
          Você já tem uma sessão em andamento.{" "}
          <Link
            className={styles.inlineLink}
            href={`/train/sessions/${activeSessionId}`}
          >
            Continuar sessão ativa
          </Link>
        </Notice>
      ) : null}

      {actionError ? <Notice tone="error">{actionError}</Notice> : null}

      <div className={styles.toolbar}>
        <Link className={styles.libraryLink} href="/train/exercises">
          Biblioteca de exercícios
        </Link>
        <Button
          variant="secondary"
          aria-pressed={showArchived}
          onClick={() => setShowArchived((current) => !current)}
        >
          {showArchived ? "Ocultar arquivadas" : "Mostrar arquivadas"}
        </Button>
      </div>

      <SectionLabel>Rotinas</SectionLabel>

      {isLoading ? (
        <Skeleton lines={4} label="Carregando rotinas…" />
      ) : error || !data ? (
        <ErrorState
          message={error ?? "Não foi possível carregar suas rotinas."}
          onRetry={reload}
        />
      ) : data.length === 0 ? (
        <EmptyState
          title={showArchived ? "Nenhuma rotina arquivada" : "Nenhuma rotina ativa"}
          description={
            showArchived
              ? "Rotinas arquivadas aparecem aqui."
              : "Crie uma rotina ou mostre as arquivadas."
          }
        />
      ) : (
        <ul className={styles.list}>
          {data.map((routine) => {
            const isArchived = routine.archivedAt != null;
            const startKey = `start:${routine.id}`;
            const cloneKey = `clone:${routine.id}`;

            return (
              <li
                key={routine.id}
                className={[styles.row, isArchived ? styles.rowArchived : null]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className={styles.rowMain}>
                  <Link
                    className={styles.rowName}
                    href={`/train/playlists/${routine.id}`}
                  >
                    {routine.name}
                  </Link>
                  <p className={styles.rowMeta}>
                    {exerciseCountLabel(routine.exerciseCount)} ·{" "}
                    {routine.lastPerformedAt
                      ? `última execução ${formatRelative(routine.lastPerformedAt, timezone)}`
                      : "nunca executada"}
                    {isArchived ? " · arquivada" : ""}
                  </p>
                </div>

                <div className={styles.rowActions}>
                  {isArchived ? null : (
                    <Button
                      variant="secondary"
                      isLoading={busyKey === startKey}
                      disabled={busyKey !== null && busyKey !== startKey}
                      onClick={() => startRoutine(routine)}
                    >
                      Iniciar
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    isLoading={busyKey === cloneKey}
                    disabled={busyKey !== null && busyKey !== cloneKey}
                    onClick={() => duplicateRoutine(routine)}
                  >
                    Duplicar
                  </Button>
                  {isArchived ? null : (
                    <Button
                      variant="ghost"
                      disabled={busyKey !== null}
                      onClick={() => setArchiveTarget(routine)}
                    >
                      Arquivar
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {archiveTarget ? (
        <ConfirmDialog
          title="Arquivar rotina?"
          description={`"${archiveTarget.name}" sai da lista ativa. Você pode mostrá-la depois em arquivadas.`}
          confirmLabel="Arquivar"
          isConfirming={isArchiving}
          onConfirm={archiveRoutine}
          onCancel={() => setArchiveTarget(null)}
        />
      ) : null}
    </div>
  );
}
