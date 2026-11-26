"use client";

import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Modal } from "@/components/ui/modal";
import { Notice } from "@/components/ui/notice";
import { SectionLabel } from "@/components/ui/section-label";
import { Skeleton } from "@/components/ui/skeleton";
import { SurfaceCard } from "@/components/ui/surface-card";
import { nextTargetSchema, type NextTarget } from "@/contracts/analytics";
import type { Completion } from "@/contracts/completion";
import { exerciseSchema, type Exercise } from "@/contracts/exercise";
import { pageSchema } from "@/contracts/page";
import {
  playlistDetailSchema,
  playlistExerciseSchema,
  type PlaylistDetail,
  type PlaylistExercise,
} from "@/contracts/playlist";
import { describeApiError } from "@/lib/api-error-text";
import { formatCount, formatKg, formatVolume } from "@/lib/format";
import { request, requestMaybe } from "@/lib/http";
import { useResource } from "@/lib/use-resource";
import { ExerciseSearch } from "./exercise-search";
import { LogWorkoutModal } from "./log-workout-modal";
import { PlaylistHeader } from "./playlist-header";
import { PlaylistItemForm } from "./playlist-item-form";
import styles from "./train.module.css";

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
      exercises.content
        .filter((exercise) => exercise.isArchived)
        .map(({ id }) => id),
    ),
  };
}

function formatRepsRange(item: PlaylistExercise): string {
  if (item.targetRepsMin != null && item.targetRepsMax != null) {
    return item.targetRepsMin === item.targetRepsMax
      ? `${item.targetRepsMin}`
      : `${item.targetRepsMin}–${item.targetRepsMax}`;
  }
  return "—";
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

function loggedMessage(completion: Completion): string {
  if (completion.loggedSets === 0) {
    return `"${completion.playlistName}" marcado como feito.`;
  }
  return `"${completion.playlistName}" registrado: ${formatCount(completion.loggedSets)} séries · ${formatVolume(completion.totalVolume)}.`;
}

export function PlaylistEditor({ playlistId }: { playlistId: string }) {
  const { data, error, isLoading, reload } = useResource(
    `playlist:${playlistId}`,
    () => loadEditor(playlistId),
  );

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [isLogging, setIsLogging] = useState(false);
  const [editingItem, setEditingItem] = useState<PlaylistExercise | null>(null);
  const [removeTarget, setRemoveTarget] = useState<PlaylistExercise | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [pendingItems, setPendingItems] = useState<PlaylistExercise[] | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function addExercise(exercise: Exercise) {
    if (addingId) return;

    setActionError(null);
    setAddingId(exercise.id);

    try {
      await request(
        {
          method: "POST",
          url: `/api/playlists/${playlistId}/exercises`,
          data: {
            exerciseId: exercise.id,
            targetSets: 3,
            targetRepsMin: 10,
            targetRepsMax: 10,
            restSeconds: 90,
          },
        },
        playlistExerciseSchema,
      );
      setIsPickerOpen(false);
      setSuccessMessage(`"${exercise.name}" adicionado à ficha.`);
      reload();
    } catch (failure) {
      setActionError(describeApiError(failure));
    } finally {
      setAddingId(null);
    }
  }

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
        <Link className={styles.backLink} href="/treinar">
          <ArrowLeft size={16} aria-hidden="true" />
          Voltar para rotinas
        </Link>
        <Skeleton lines={4} label="Carregando rotina…" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.editorScreen}>
        <Link className={styles.backLink} href="/treinar">
          <ArrowLeft size={16} aria-hidden="true" />
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
      <Link className={styles.backLink} href="/treinar">
        <ArrowLeft size={16} aria-hidden="true" />
        Voltar para rotinas
      </Link>

      <SurfaceCard className={styles.editorHeroCard}>
        <PlaylistHeader playlist={playlist} onSaved={reload} />

        {isArchived ? null : (
          <Button fullWidth onClick={() => setIsLogging(true)}>
            <ClipboardCheck size={17} aria-hidden="true" />
            Registrar treino
          </Button>
        )}
      </SurfaceCard>

      {successMessage ? <Notice tone="success">{successMessage}</Notice> : null}

      {isArchived ? (
        <Notice tone="info">
          Esta rotina está arquivada e funciona apenas para consulta.
        </Notice>
      ) : null}

      {actionError ? <Notice tone="error">{actionError}</Notice> : null}

      <div className={styles.itemsHeader}>
        <div className={styles.itemsTitle}>
          <SectionLabel>Exercícios da ficha</SectionLabel>
        </div>
        {isArchived || items.length === 0 ? null : (
          <Button size="sm" onClick={() => setIsPickerOpen(true)}>
            <Plus size={15} aria-hidden="true" />
            Adicionar
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Rotina sem exercícios"
          description={
            isArchived
              ? "Esta rotina arquivada não possui exercícios cadastrados."
              : "Adicione o primeiro exercício para estruturar sua ficha de treino."
          }
          action={
            isArchived ? undefined : (
              <Button onClick={() => setIsPickerOpen(true)}>
                <Plus size={16} aria-hidden="true" />
                Adicionar exercício
              </Button>
            )
          }
        />
      ) : (
        <ul className={styles.itemList}>
          {items.map((item, index) => {
            const isExerciseArchived = archivedExerciseIds.has(item.exerciseId);
            const target = targetsByExercise.get(item.exerciseId);
            const lastLoad = target ? formatLoad(target.lastWeight, target.lastReps) : null;
            const suggestedLoad = target
              ? formatLoad(target.suggestedWeight, target.suggestedReps)
              : null;

            return (
              <li key={item.id}>
                <SurfaceCard as="article" className={styles.itemCard}>
                  <div className={styles.itemTop}>
                    <div className={styles.itemInfo}>
                      <div className={styles.itemTitleRow}>
                        <span className={styles.itemOrderBadge}>
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <h3 className={styles.itemName}>{item.exerciseName}</h3>
                        {isExerciseArchived ? (
                          <Badge tone="neutral">Arquivado</Badge>
                        ) : null}
                      </div>
                      {item.primaryMuscle ? (
                        <span className={styles.itemMuscle}>{item.primaryMuscle}</span>
                      ) : null}
                    </div>

                    {isArchived ? null : (
                      <div className={styles.itemActions}>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Mover ${item.exerciseName} para cima`}
                          disabled={index === 0 || isReordering}
                          onClick={() => moveItem(index, -1)}
                        >
                          <ChevronUp size={18} aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Mover ${item.exerciseName} para baixo`}
                          disabled={index === items.length - 1 || isReordering}
                          onClick={() => moveItem(index, 1)}
                        >
                          <ChevronDown size={18} aria-hidden="true" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="icon"
                          aria-label={`Editar alvos de ${item.exerciseName}`}
                          onClick={() => setEditingItem(item)}
                        >
                          <Pencil size={16} aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Remover ${item.exerciseName}`}
                          disabled={isReordering}
                          onClick={() => setRemoveTarget(item)}
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className={styles.itemMetricsGrid}>
                    <div className={styles.itemMetricCell}>
                      <span className={styles.itemMetricLabel}>Carga-alvo</span>
                      <strong className={styles.itemMetricValue}>
                        {item.targetWeightKg != null && item.targetWeightKg > 0
                          ? `${formatKg(item.targetWeightKg)} kg`
                          : "—"}
                      </strong>
                    </div>
                    <div className={styles.itemMetricCell}>
                      <span className={styles.itemMetricLabel}>Séries × Reps</span>
                      <strong className={styles.itemMetricValue}>
                        {item.targetSets != null ? formatCount(item.targetSets) : "—"} ×{" "}
                        {formatRepsRange(item)}
                      </strong>
                    </div>
                    <div className={styles.itemMetricCell}>
                      <span className={styles.itemMetricLabel}>Descanso</span>
                      <strong className={styles.itemMetricValue}>
                        {item.restSeconds != null
                          ? `${formatCount(item.restSeconds)} s`
                          : "—"}
                      </strong>
                    </div>
                  </div>

                  <div className={styles.itemProgressionBar}>
                    <div className={styles.itemProgressionItem}>
                      <span className={styles.itemProgressionLabel}>Última carga:</span>
                      <span className={styles.itemProgressionVal}>
                        {lastLoad ?? "Sem histórico"}
                      </span>
                    </div>
                    {suggestedLoad ? (
                      <div className={styles.itemProgressionSuggestion}>
                        <Sparkles size={13} aria-hidden="true" />
                        <span>Sugestão: {suggestedLoad}</span>
                      </div>
                    ) : null}
                  </div>

                  {item.note ? (
                    <p className={styles.itemNote}>{item.note}</p>
                  ) : null}
                </SurfaceCard>
              </li>
            );
          })}
        </ul>
      )}

      {!isArchived && isPickerOpen ? (
        <Modal
          title="Adicionar exercício"
          description="Busque na biblioteca ou crie um novo exercício com seu músculo-alvo."
          size="large"
          onClose={() => setIsPickerOpen(false)}
          footer={
            <Button variant="secondary" onClick={() => setIsPickerOpen(false)}>
              Concluir
            </Button>
          }
        >
          <ExerciseSearch
            excludedIds={new Set(items.map((item) => item.exerciseId))}
            pendingId={addingId}
            onSelect={addExercise}
          />
        </Modal>
      ) : null}

      {isLogging ? (
        <LogWorkoutModal
          planId={playlist.id}
          planName={playlist.name}
          onLogged={(completion) => {
            setIsLogging(false);
            setSuccessMessage(loggedMessage(completion));
            reload();
          }}
          onClose={() => setIsLogging(false)}
        />
      ) : null}

      {editingItem ? (
        <PlaylistItemForm
          playlistId={playlistId}
          item={editingItem}
          onSaved={() => {
            setEditingItem(null);
            reload();
          }}
          onCancel={() => setEditingItem(null)}
        />
      ) : null}

      {removeTarget ? (
        <ConfirmDialog
          title="Remover exercício?"
          description={`"${removeTarget.exerciseName}" será removido desta rotina.`}
          confirmLabel="Remover"
          isConfirming={isRemoving}
          onConfirm={removeItem}
          onCancel={() => setRemoveTarget(null)}
        />
      ) : null}
    </div>
  );
}
