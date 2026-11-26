"use client";

import { ChevronDown, ChevronUp, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Notice } from "@/components/ui/notice";
import { PrimaryButton } from "@/components/ui/primary-button";
import { SectionLabel } from "@/components/ui/section-label";
import { Skeleton } from "@/components/ui/skeleton";
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
import { formatPrescription } from "./exercise-entries";
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
    // shortcut: archived-exercise flags use the first 100 exercises; fetch by id once the API exposes it
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
  const rest = item.restSeconds != null ? `${formatCount(item.restSeconds)} s rest` : null;

  return [formatPrescription(item, formatKg), item.primaryMuscle, rest]
    .filter((part): part is string => Boolean(part))
    .join(" · ");
}

function loggedMessage(completion: Completion): string {
  return completion.loggedSets === 0
    ? "Workout marked as done."
    : `Workout logged: ${formatCount(completion.loggedSets)} sets, ${formatVolume(completion.totalVolume)}.`;
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
  if (!target) return "No history yet";

  const last = formatLoad(target.lastWeight, target.lastReps);
  const suggested = formatLoad(target.suggestedWeight, target.suggestedReps);

  return [
    last ? `Last ${last}` : "No history yet",
    suggested ? `Next ${suggested}` : null,
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
  const [isLogging, setIsLogging] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);

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
      setSuccessMessage(`${exercise.name} added. Set its weight, sets and reps with Edit.`);
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
        <Link className={styles.backLink} href="/train">
          Back to workout plans
        </Link>
        <Skeleton lines={5} label="Loading workout plan…" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.editorScreen}>
        <Link className={styles.backLink} href="/train">
          Back to workout plans
        </Link>
        <ErrorState
          message={error ?? "Could not load the workout plan."}
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
        Back to workout plans
      </Link>

      <PlaylistHeader playlist={playlist} onSaved={reload} />

      {isArchived ? null : (
        <PrimaryButton
          fullWidth
          icon={<ClipboardCheck size={16} strokeWidth={1.75} />}
          onClick={() => setIsLogging(true)}
        >
          Log workout
        </PrimaryButton>
      )}
      {successMessage ? <Notice tone="success">{successMessage}</Notice> : null}

      {isArchived ? (
        <Notice tone="info">This plan is archived and cannot be edited.</Notice>
      ) : null}

      {actionError ? <Notice tone="error">{actionError}</Notice> : null}

      {!isArchived && isPickerOpen ? (
        <section className={styles.picker}>
          <ExerciseSearch
            excludedIds={new Set(items.map((item) => item.exerciseId))}
            pendingId={addingId}
            onSelect={addExercise}
          />
          <Button variant="ghost" onClick={() => setIsPickerOpen(false)}>
            Done adding
          </Button>
        </section>
      ) : null}

      <div className={styles.itemsHeader}>
        <div className={styles.itemsTitle}>
          <SectionLabel>Exercises</SectionLabel>
        </div>
        {isArchived || isPickerOpen || items.length === 0 ? null : (
          <Button onClick={() => setIsPickerOpen(true)}>Add exercise</Button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="No exercises yet"
          description={
            isArchived
              ? "This archived plan has no exercises."
              : "Add the first exercise to build this plan."
          }
          action={
            isArchived || isPickerOpen ? undefined : (
              <Button onClick={() => setIsPickerOpen(true)}>
                Add exercise
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
                          Archived exercise
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
                        aria-label={`Move ${item.exerciseName} up`}
                        disabled={index === 0 || isReordering}
                        onClick={() => moveItem(index, -1)}
                      >
                        <ChevronUp size={20} aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        aria-label={`Move ${item.exerciseName} down`}
                        disabled={index === items.length - 1 || isReordering}
                        onClick={() => moveItem(index, 1)}
                      >
                        <ChevronDown size={20} aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        aria-label={`Edit targets for ${item.exerciseName}`}
                        onClick={() => setEditingItemId(item.id)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        aria-label={`Remove ${item.exerciseName}`}
                        disabled={isReordering}
                        onClick={() => setRemoveTarget(item)}
                      >
                        Remove
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

      {isLogging ? (
        <LogWorkoutModal
          planId={playlist.id}
          planName={playlist.name}
          onLogged={(completion) => {
            setIsLogging(false);
            setSuccessMessage(loggedMessage(completion));
          }}
          onClose={() => setIsLogging(false)}
        />
      ) : null}

      {removeTarget ? (
        <ConfirmDialog
          title="Remove this exercise?"
          description={`"${removeTarget.exerciseName}" will be removed from this plan.`}
          confirmLabel="Remove"
          isConfirming={isRemoving}
          onConfirm={removeItem}
          onCancel={() => setRemoveTarget(null)}
        />
      ) : null}
    </div>
  );
}
