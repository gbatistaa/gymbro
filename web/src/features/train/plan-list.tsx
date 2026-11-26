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
import { formatCount, formatVolume } from "@/lib/format";
import { z } from "zod";
import { request, requestMaybe } from "@/lib/http";
import { notifyApiError } from "@/lib/notify";
import { useResource } from "@/lib/use-resource";
import { sessionAtom } from "@/stores/session";
import { CreatePlanModal } from "./create-plan-modal";
import { LogWorkoutModal } from "./log-workout-modal";
import { PlanCard } from "./plan-card";
import styles from "./plans.module.css";

function loggedMessage(completion: Completion): string {
  if (completion.loggedSets === 0) {
    return `"${completion.playlistName}" marcado como feito.`;
  }
  return `"${completion.playlistName}" registrado: ${formatCount(completion.loggedSets)} séries · ${formatVolume(completion.totalVolume)}.`;
}

export function PlanList() {
  const user = useAtomValue(sessionAtom)?.user;
  const timezone = user?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

  const [isCreating, setIsCreating] = useState(false);
  const [logTarget, setLogTarget] = useState<PlaylistSummary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PlaylistSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data, error, isLoading, reload } = useResource("plans", () =>
    request({ url: "/api/playlists" }, playlistSummarySchema.array()),
  );

  const plans = data ?? [];

  function showSuccess(message: string) {
    setSuccessMessage(message);
  }

  async function duplicatePlan(plan: PlaylistSummary) {
    try {
      await request({ method: "POST", url: `/api/playlists/${plan.id}/clone` }, playlistSchema);
      showSuccess(`"${plan.name}" duplicada.`);
      reload();
    } catch (failure) {
      notifyApiError(failure);
    }
  }

  async function deletePlan() {
    if (!deleteTarget || isDeleting) return;

    setIsDeleting(true);
    try {
      await requestMaybe({ method: "DELETE", url: `/api/playlists/${deleteTarget.id}` }, z.unknown());
      showSuccess(`"${deleteTarget.name}" excluída.`);
      setDeleteTarget(null);
      reload();
    } catch (failure) {
      setDeleteTarget(null);
      notifyApiError(failure);
    } finally {
      setIsDeleting(false);
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
          <span className={styles.pageKicker}>Fichas de treino</span>
          <h1 className={styles.screenTitle}>Treinar</h1>
          <p className={`${styles.screenSubtitle} tabular-nums`}>
            {data
              ? `${formatCount(plans.length)} ${plans.length === 1 ? "ficha de treino" : "fichas de treino"}`
              : "Suas fichas de treino"}
          </p>
        </div>

        <PrimaryButton icon={<Plus size={16} strokeWidth={2} />} onClick={() => setIsCreating(true)}>
          Nova ficha
        </PrimaryButton>
      </div>

      {successMessage ? <Notice tone="success">{successMessage}</Notice> : null}

      {isLoading ? (
        <Skeleton lines={4} label="Carregando fichas…" />
      ) : error || !data ? (
        <ErrorState message={error ?? "Não foi possível carregar suas fichas."} onRetry={reload} />
      ) : plans.length === 0 ? (
        <EmptyState
          title="Nenhuma ficha de treino ainda"
          description="Crie uma ficha com seus exercícios, cargas, séries e repetições."
          action={
            <PrimaryButton icon={<Plus size={16} strokeWidth={2} />} onClick={() => setIsCreating(true)}>
              Criar primeira ficha
            </PrimaryButton>
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
                onDelete={setDeleteTarget}
              />
            </li>
          ))}
        </ul>
      )}

      {isCreating ? (
        <CreatePlanModal
          onCreated={() => {
            setIsCreating(false);
            showSuccess("Ficha de treino criada.");
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

      {deleteTarget ? (
        <ConfirmDialog
          title="Excluir esta ficha?"
          description={`"${deleteTarget.name}" será excluída em definitivo. Os treinos que você já registrou continuam no seu histórico e no Progresso.`}
          confirmLabel="Excluir"
          isConfirming={isDeleting}
          onConfirm={deletePlan}
          onCancel={() => setDeleteTarget(null)}
        />
      ) : null}
    </div>
  );
}
