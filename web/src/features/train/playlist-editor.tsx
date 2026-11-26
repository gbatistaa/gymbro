"use client";

import { ArrowLeft, ClipboardCheck, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Modal } from "@/components/ui/modal";
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
import { formatCount, formatVolume } from "@/lib/format";
import { request, requestMaybe } from "@/lib/http";
import { notifyApiError, notifySuccess } from "@/lib/notify";
import { useResource } from "@/lib/use-resource";
import { ExerciseSearch } from "./exercise-search";
import { LogWorkoutModal } from "./log-workout-modal";
import { PlaylistHeader } from "./playlist-header";
import { PlaylistItemForm } from "./playlist-item-form";
import { PlaylistItemList } from "./playlist-item-list";
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
  const router = useRouter();
  const [isLogging, setIsLogging] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingPlan, setIsDeletingPlan] = useState(false);
  const [editingItem, setEditingItem] = useState<PlaylistExercise | null>(null);
  const [removeTarget, setRemoveTarget] = useState<PlaylistExercise | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [pendingItems, setPendingItems] = useState<PlaylistExercise[] | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  /** Recarrega do servidor; a ordem otimista deixa de valer porque o servidor passa a ser a fonte. */
  function refresh() {
    setPendingItems(null);
    reload();
  }

  async function addExercise(exercise: Exercise) {
    if (addingId) return;

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
      notifySuccess(`"${exercise.name}" adicionado à ficha.`);
      refresh();
    } catch (failure) {
      notifyApiError(failure);
    } finally {
      setAddingId(null);
    }
  }

  /**
   * Aplica a nova ordem na tela na hora e a salva no servidor. Em caso de sucesso a ordem
   * confirmada permanece, sem recarregar a tela (o que faria a lista pular a cada arraste).
   */
  async function reorderItems(next: PlaylistExercise[]) {
    if (isReordering) return;

    setPendingItems(next);
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
    } catch (failure) {
      setPendingItems(null);
      notifyApiError(failure);
    } finally {
      setIsReordering(false);
    }
  }

  async function deletePlan() {
    if (isDeletingPlan) return;

    setIsDeletingPlan(true);
    try {
      await requestMaybe({ method: "DELETE", url: `/api/playlists/${playlistId}` }, z.unknown());
      router.push("/treinar");
    } catch (failure) {
      setIsDeleting(false);
      notifyApiError(failure);
      setIsDeletingPlan(false);
    }
  }

  async function removeItem() {
    if (!removeTarget || isRemoving) return;

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
      refresh();
    } catch (failure) {
      setRemoveTarget(null);
      notifyApiError(failure);
    } finally {
      setIsRemoving(false);
    }
  }

  if (isLoading) {
    return (
      <div className={styles.editorScreen}>
        <Link className={styles.backLink} href="/treinar">
          <ArrowLeft size={16} aria-hidden="true" />
          Voltar para fichas
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
          Voltar para fichas
        </Link>
        <ErrorState
          message={error ?? "Não foi possível carregar a rotina."}
          onRetry={reload}
        />
      </div>
    );
  }

  const { playlist, targets, archivedExerciseIds } = data;
  const items = pendingItems ?? playlist.exercises;
  const targetsByExercise = new Map(
    targets.map((target) => [target.exerciseId, target]),
  );

  return (
    <div className={styles.editorScreen}>
      <Link className={styles.backLink} href="/treinar">
        <ArrowLeft size={16} aria-hidden="true" />
        Voltar para fichas
      </Link>

      <SurfaceCard className={styles.editorHeroCard}>
        <PlaylistHeader playlist={playlist} onSaved={refresh} />

        <Button fullWidth onClick={() => setIsLogging(true)}>
          <ClipboardCheck size={17} aria-hidden="true" />
          Registrar treino
        </Button>
        <Button fullWidth variant="ghost" onClick={() => setIsDeleting(true)}>
          <Trash2 size={16} aria-hidden="true" />
          Excluir ficha
        </Button>
      </SurfaceCard>

      <div className={styles.itemsHeader}>
        <div className={styles.itemsTitle}>
          <SectionLabel>Exercícios da ficha</SectionLabel>
        </div>
        {items.length === 0 ? null : (
          <Button size="sm" onClick={() => setIsPickerOpen(true)}>
            <Plus size={15} aria-hidden="true" />
            Adicionar
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Ficha sem exercícios"
          description="Adicione o primeiro exercício para estruturar sua ficha de treino."
          action={
            <Button onClick={() => setIsPickerOpen(true)}>
              <Plus size={16} aria-hidden="true" />
              Adicionar exercício
            </Button>
          }
        />
      ) : (
        <PlaylistItemList
          items={items}
          archivedExerciseIds={archivedExerciseIds}
          targetsByExercise={targetsByExercise}
          isLocked={isReordering}
          onReorder={reorderItems}
          onEdit={setEditingItem}
          onRemove={setRemoveTarget}
        />
      )}

      {isPickerOpen ? (
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
            notifySuccess(loggedMessage(completion));
            refresh();
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
            refresh();
          }}
          onCancel={() => setEditingItem(null)}
        />
      ) : null}

      {isDeleting ? (
        <ConfirmDialog
          title="Excluir esta ficha?"
          description={`"${playlist.name}" será excluída em definitivo. Os treinos que você já registrou continuam no seu histórico e no Progresso.`}
          confirmLabel="Excluir"
          isConfirming={isDeletingPlan}
          onConfirm={deletePlan}
          onCancel={() => setIsDeleting(false)}
        />
      ) : null}

      {removeTarget ? (
        <ConfirmDialog
          title="Remover exercício?"
          description={`"${removeTarget.exerciseName}" será removido desta ficha.`}
          confirmLabel="Remover"
          isConfirming={isRemoving}
          onConfirm={removeItem}
          onCancel={() => setRemoveTarget(null)}
        />
      ) : null}
    </div>
  );
}
