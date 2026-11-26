"use client";

import { Plus } from "lucide-react";
import { useAtomValue } from "jotai";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Notice } from "@/components/ui/notice";
import { PrimaryButton } from "@/components/ui/primary-button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Completion } from "@/contracts/completion";
import { playlistSchema, playlistSummarySchema, type PlaylistSummary } from "@/contracts/playlist";
import { describeApiError } from "@/lib/api-error-text";
import { formatCount, formatVolume } from "@/lib/format";
import { request } from "@/lib/http";
import { useResource } from "@/lib/use-resource";
import { sessionAtom } from "@/stores/session";
import { CreatePlanModal } from "./create-plan-modal";
import { LogWorkoutModal } from "./log-workout-modal";
import { PlanCard } from "./plan-card";
import styles from "./plans.module.css";

type Filter = "active" | "archived";

function loggedMessage(completion: Completion): string {
  if (completion.loggedSets === 0) {
    return `"${completion.playlistName}" marked as done.`;
  }
  return `"${completion.playlistName}" logged: ${formatCount(completion.loggedSets)} sets, ${formatVolume(completion.totalVolume)}.`;
}

export function PlanList() {
  const user = useAtomValue(sessionAtom)?.user;
  const timezone = user?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

  const [filter, setFilter] = useState<Filter>("active");
  const [isCreating, setIsCreating] = useState(false);
  const [logTarget, setLogTarget] = useState<PlaylistSummary | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<PlaylistSummary | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, error, isLoading, reload } = useResource(`plans:${filter}`, () =>
    request(
      { url: "/api/playlists", params: { includeArchived: filter === "archived" } },
      playlistSummarySchema.array(),
    ),
  );

  const plans = (data ?? []).filter((plan) =>
    filter === "archived" ? plan.archivedAt != null : plan.archivedAt == null,
  );

  function showSuccess(message: string) {
    setActionError(null);
    setSuccessMessage(message);
  }

  async function duplicatePlan(plan: PlaylistSummary) {
    try {
      await request({ method: "POST", url: `/api/playlists/${plan.id}/clone` }, playlistSchema);
      showSuccess(`"${plan.name}" duplicated.`);
      reload();
    } catch (failure) {
      setActionError(describeApiError(failure));
    }
  }

  async function archivePlan() {
    if (!archiveTarget || isArchiving) return;

    setIsArchiving(true);
    try {
      await request(
        { method: "POST", url: `/api/playlists/${archiveTarget.id}/archive` },
        playlistSchema,
      );
      showSuccess(`"${archiveTarget.name}" archived.`);
      setArchiveTarget(null);
      reload();
    } catch (failure) {
      setArchiveTarget(null);
      setActionError(describeApiError(failure));
    } finally {
      setIsArchiving(false);
    }
  }

  function handleLogged(completion: Completion) {
    setLogTarget(null);
    showSuccess(loggedMessage(completion));
    reload();
  }

  return (
    <div className={styles.screen}>
      <div className={styles.topRow}>
        <div className={styles.titleGroup}>
          <h1 className={`${styles.screenTitle} text-text`}>Workout plans</h1>
          <p className={`${styles.screenSubtitle} tabular-nums text-muted`}>
            {data
              ? `${formatCount(plans.length)} ${filter === "active" ? "active" : "archived"} ${plans.length === 1 ? "plan" : "plans"}`
              : "Your training sheets"}
          </p>
        </div>

        <PrimaryButton icon={<Plus size={16} strokeWidth={1.75} />} onClick={() => setIsCreating(true)}>
          New plan
        </PrimaryButton>
      </div>

      <div
        className={`${styles.segmentedControl} bg-surface border-token radius-card`}
        role="group"
        aria-label="Filter plans"
      >
        {(["active", "archived"] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={filter === option}
            onClick={() => setFilter(option)}
            className={[
              styles.segmentButton,
              filter === option
                ? `${styles.segmentButtonActive} bg-surface-2 border-token text-text`
                : "text-muted",
            ].join(" ")}
          >
            {option === "active" ? "Active" : "Archived"}
          </button>
        ))}
      </div>

      {successMessage ? <Notice tone="success">{successMessage}</Notice> : null}
      {actionError ? <Notice tone="error">{actionError}</Notice> : null}

      {isLoading ? (
        <Skeleton lines={5} label="Loading workout plans…" />
      ) : error || !data ? (
        <ErrorState message={error ?? "Could not load your workout plans."} onRetry={reload} />
      ) : plans.length === 0 ? (
        <EmptyState
          title={filter === "archived" ? "No archived plans" : "No workout plans yet"}
          description={
            filter === "archived"
              ? "Plans you archive show up here."
              : "Create a plan with your exercises, weights, sets and reps."
          }
          action={
            filter === "active" ? (
              <PrimaryButton icon={<Plus size={16} strokeWidth={1.75} />} onClick={() => setIsCreating(true)}>
                Create your first plan
              </PrimaryButton>
            ) : undefined
          }
        />
      ) : (
        <ul className={styles.routineList}>
          {plans.map((plan) => (
            <li key={plan.id}>
              <PlanCard
                plan={plan}
                timezone={timezone}
                onLog={setLogTarget}
                onDuplicate={duplicatePlan}
                onArchive={setArchiveTarget}
              />
            </li>
          ))}
        </ul>
      )}

      {isCreating ? (
        <CreatePlanModal
          onCreated={() => {
            setIsCreating(false);
            setFilter("active");
            showSuccess("Workout plan created.");
            reload();
          }}
          onClose={() => setIsCreating(false)}
        />
      ) : null}

      {logTarget ? (
        <LogWorkoutModal
          planId={logTarget.id}
          planName={logTarget.name}
          onLogged={handleLogged}
          onClose={() => setLogTarget(null)}
        />
      ) : null}

      {archiveTarget ? (
        <ConfirmDialog
          title="Archive this plan?"
          description={`"${archiveTarget.name}" leaves your active list. You can still find it under Archived.`}
          confirmLabel="Archive"
          isConfirming={isArchiving}
          onConfirm={archivePlan}
          onCancel={() => setArchiveTarget(null)}
        />
      ) : null}
    </div>
  );
}
