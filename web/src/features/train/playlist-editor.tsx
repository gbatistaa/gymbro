"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Notice } from "@/components/ui/notice";
import { SectionLabel } from "@/components/ui/section-label";
import { Skeleton } from "@/components/ui/skeleton";
import { nextTargetSchema, type NextTarget } from "@/contracts/analytics";
import { exerciseSchema } from "@/contracts/exercise";
import { pageSchema } from "@/contracts/page";
import {
  playlistDetailSchema,
  type PlaylistDetail,
  type PlaylistExercise,
} from "@/contracts/playlist";
import { describeApiError } from "@/lib/api-error-text";
import { formatCount, formatKg } from "@/lib/format";
import { request, requestMaybe } from "@/lib/http";
import { useResource } from "@/lib/use-resource";
import { ExercisePicker } from "./exercise-picker";
import { PlaylistHeader } from "./playlist-header";
import { PlaylistItemForm } from "./playlist-item-form";
import styles from "./train.module.css";
import { useCompleteRoutine } from "./use-complete-routine";

type EditorData = {
  playlist: PlaylistDetail;
  targets: NextTarget[];
  archivedExerciseIds: Set<string>;
};

async function loadEditor(playlistId: string): Promise<EditorData> {
  const [playlist, targets, exercises] = await Promise.all([
    request({ url: `/api/playlists/${playlistId}` }, playlistDetailSchema),
    request(
      { url: `/api/playlists/${playlistId}/next-targets` },
      nextTargetSchema.array(),
    ),
    // shortcut: marcação de exercício arquivado usa os primeiros 100; buscar por id quando a API expuser
    request(
      {
        url: "/api/exercises",
        params: { includeArchived: true, page: 0, size: 100 },
      },
      pageSchema(exerciseSchema),
    ),
  ]);

  return {
    playlist,
    targets,
    archivedExerciseIds: new Set(
      exercises.content.filter((exercise) => exercise.isArchived).map(({ id }) => id),
    ),
  };
}

function formatItemTargets(item: PlaylistExercise): string {
  const reps =
    item.targetRepsMin != null && item.targetRepsMax != null
      ? item.targetRepsMin === item.targetRepsMax
        ? `${item.targetRepsMin}`
        : `${item.targetRepsMin}–${item.targetRepsMax}`
      : "—";
  const sets = item.targetSets ?? "—";
  const rest =
    item.restSeconds != null ? `${formatCount(item.restSeconds)} s` : null;

  return [`${sets} × ${reps}`, rest].filter(Boolean).join(" · ");
}

function formatLoad(
  weight: number | null | undefined,
  reps: number | null | undefined,
): string | null {
  if (weight == null && reps == null) return null;
  if (weight == null) return `${formatCount(reps)} reps`;
  if (reps == null) return `${formatKg(weight)} kg`;
  return `${formatKg(weight)} kg × ${formatCount(reps)}`;
}

function formatSuggestion(target: NextTarget | undefined): string {
  if (!target) return "Sem histórico";

  const last = formatLoad(target.lastWeight, target.lastReps);
  const suggested = formatLoad(target.suggestedWeight, target.suggestedReps);

  return [
    last ? `Última ${last}` : "Sem histórico",
    suggested ? `Sugestão ${suggested}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function PlaylistEditor({ playlistId }: { playlistId: string }) {
  const { data, error, isLoading, reload } = useResource(
    `playlist:${playlistId}`,
    () => loadEditor(playlistId),
  );

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<PlaylistExercise | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [pendingItems, setPendingItems] = useState<PlaylistExercise[] | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const completion = useCompleteRoutine();

  async function moveItem(index: number, direction: -1 | 1) {
    if (!data || isReordering) return;

    const items = pendingItems ?? data.playlist.exercises;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);

    setPendingItems(next);
    setActionError(null);
    setIsReordering(true);

    try {
      await request(
        {
          method: "PUT",
          url: `/api/playlists/${playlistId}/order`,
          data: {
            items: next.map((item, orderIndex) => ({
              playlistExerciseId: item.id,
              orderIndex,
            })),
          },
        },
        playlistDetailSchema,
      );
      setPendingItems(null);
      reload();
    } catch (failure) {
      setPendingItems(null);
      setActionError(describeApiError(failure));
    } finally {
      setIsReordering(false);
    }
  }

  async function removeItem() {
    if (!removeTarget || isRemoving) return;

    setActionError(null);
    setIsRemoving(true);

    try {
      await requestMaybe(
        {
          method: "DELETE",
          url: `/api/playlists/${playlistId}/exercises/${removeTarget.id}`,
        },
        z.unknown(),
      );
      setRemoveTarget(null);
      reload();
    } catch (failure) {
      setRemoveTarget(null);
      setActionError(describeApiError(failure));
    } finally {
      setIsRemoving(false);
    }
  }

  if (isLoading) {
    return (
      <div className={styles.editorScreen}>
        <Link className={styles.backLink} href="/train">
          Voltar para rotinas
        </Link>
        <Skeleton lines={5} label="Carregando rotina…" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.editorScreen}>
        <Link className={styles.backLink} href="/train">
          Voltar para rotinas
        </Link>
        <ErrorState
          message={error ?? "Não foi possível carregar a rotina."}
          onRetry={reload}
        />
      </div>
    );
  }

  const { playlist, targets, archivedExerciseIds } = data;
  const isArchived = playlist.archivedAt != null;
  const items = pendingItems ?? playlist.exercises;
  const targetsByExercise = new Map(
    targets.map((target) => [target.exerciseId, target]),
  );

  return (
    <div className={styles.editorScreen}>
      <Link className={styles.backLink} href="/train">
        Voltar para rotinas
      </Link>

      <PlaylistHeader playlist={playlist} onSaved={reload} />

      {isArchived ? null : (
        <Button
          fullWidth
          isLoading={completion.pendingId === playlistId}
          disabled={completion.pendingId !== null}
          onClick={() => completion.complete(playlistId)}
        >
          Fiz o treino
        </Button>
      )}
      {completion.success ? <Notice tone="success">{completion.success}</Notice> : null}
      {completion.error ? <Notice tone="error">{completion.error}</Notice> : null}

      {isArchived ? (
        <Notice tone="info">
          Esta rotina está arquivada e não pode ser editada.
        </Notice>
      ) : null}

      {actionError ? <Notice tone="error">{actionError}</Notice> : null}

      {!isArchived && isPickerOpen ? (
        <ExercisePicker
          playlistId={playlistId}
          onAdded={() => {
            setIsPickerOpen(false);
            reload();
          }}
          onCancel={() => setIsPickerOpen(false)}
        />
      ) : null}

      <div className={styles.itemsHeader}>
        <div className={styles.itemsTitle}>
          <SectionLabel>Exercícios</SectionLabel>
        </div>
        {isArchived || isPickerOpen || items.length === 0 ? null : (
          <Button onClick={() => setIsPickerOpen(true)}>Adicionar exercício</Button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Rotina sem exercícios"
          description={
            isArchived
              ? "Esta rotina arquivada não tem exercícios."
              : "Adicione o primeiro exercício para montar o treino."
          }
          action={
            isArchived || isPickerOpen ? undefined : (
              <Button onClick={() => setIsPickerOpen(true)}>
                Adicionar exercício
              </Button>
            )
          }
        />
      ) : (
        <ul className={styles.itemList}>
          {items.map((item, index) => {
            const isEditing = editingItemId === item.id;
            const isExerciseArchived = archivedExerciseIds.has(item.exerciseId);
            const target = targetsByExercise.get(item.exerciseId);

            return (
              <li key={item.id} className={styles.item}>
                <div className={styles.itemTop}>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>
                      {item.exerciseName}
                      {isExerciseArchived ? (
                        <span className={styles.archivedTag}>
                          Exercício arquivado
                        </span>
                      ) : null}
                    </span>
                    <span className={styles.itemTargets}>
                      {formatItemTargets(item)}
                    </span>
                    <span className={styles.itemSuggestion}>
                      {formatSuggestion(target)}
                    </span>
                  </div>

                  {isArchived || isEditing ? null : (
                    <div className={styles.itemActions}>
                      <Button
                        variant="ghost"
                        aria-label={`Mover ${item.exerciseName} para cima`}
                        disabled={index === 0 || isReordering}
                        onClick={() => moveItem(index, -1)}
                      >
                        <ChevronUp size={20} aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        aria-label={`Mover ${item.exerciseName} para baixo`}
                        disabled={index === items.length - 1 || isReordering}
                        onClick={() => moveItem(index, 1)}
                      >
                        <ChevronDown size={20} aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        aria-label={`Editar alvos de ${item.exerciseName}`}
                        onClick={() => setEditingItemId(item.id)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        aria-label={`Remover ${item.exerciseName}`}
                        disabled={isReordering}
                        onClick={() => setRemoveTarget(item)}
                      >
                        Remover
                      </Button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <PlaylistItemForm
                    playlistId={playlistId}
                    item={item}
                    onSaved={() => {
                      setEditingItemId(null);
                      reload();
                    }}
                    onCancel={() => setEditingItemId(null)}
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {removeTarget ? (
        <ConfirmDialog
          title="Remover exercício?"
          description={`"${removeTarget.exerciseName}" sai desta rotina.`}
          confirmLabel="Remover"
          isConfirming={isRemoving}
          onConfirm={removeItem}
          onCancel={() => setRemoveTarget(null)}
        />
      ) : null}
    </div>
  );
}
