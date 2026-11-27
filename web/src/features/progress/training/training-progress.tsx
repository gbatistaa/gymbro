"use client";

import { useState } from "react";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { dashboardSchema, muscleVolumeSchema } from "@/contracts/analytics";
import { request } from "@/lib/http";
import { useResource } from "@/lib/use-resource";
import { useUserTimeZone } from "@/lib/use-user-time-zone";
import { fetchPinnedExercises } from "../progress-api";
import styles from "../progress.module.css";
import { ExerciseEvolutionModal, type EvolutionTarget } from "./exercise-evolution-modal";
import { ExerciseProgressList } from "./exercise-progress-list";
import { MuscleVolumeCard } from "./muscle-volume-card";
import { PinnedExercisesSection } from "./pinned-exercises-section";
import { KPI_WEEKS, TrainingKpis } from "./training-kpis";

async function loadOverview() {
  const [dashboard, muscles] = await Promise.all([
    request({ url: "/api/dashboard", params: { weeks: KPI_WEEKS } }, dashboardSchema),
    request({ url: "/api/dashboard/muscle-volume" }, muscleVolumeSchema.array()),
  ]);
  return { dashboard, muscles };
}

/** Aba Treino: números do período, fixados, lista de exercícios e distribuição por músculo. */
export function TrainingProgress() {
  const timeZone = useUserTimeZone();
  const overview = useResource("progress:overview", loadOverview);
  const pinned = useResource("progress:pinned", fetchPinnedExercises);
  const [listRefreshToken, setListRefreshToken] = useState(0);
  const [openExercise, setOpenExercise] = useState<EvolutionTarget | null>(null);

  function handlePinnedChange() {
    pinned.reload();
    // a lista mostra quem está fixado
    setListRefreshToken((token) => token + 1);
  }

  return (
    <div className={styles.tabPanel}>
      {overview.error ? (
        <ErrorState message={overview.error} onRetry={overview.reload} />
      ) : overview.data === null ? (
        <Skeleton lines={2} label="Carregando seus números…" />
      ) : (
        <TrainingKpis dashboard={overview.data.dashboard} />
      )}

      <PinnedExercisesSection
        pinned={pinned}
        timeZone={timeZone}
        onPinnedChange={handlePinnedChange}
        onOpenExercise={setOpenExercise}
      />

      <ExerciseProgressList
        refreshToken={listRefreshToken}
        timeZone={timeZone}
        onOpenExercise={setOpenExercise}
      />

      {overview.data !== null ? <MuscleVolumeCard muscles={overview.data.muscles} /> : null}

      {openExercise !== null ? (
        <ExerciseEvolutionModal exercise={openExercise} onClose={() => setOpenExercise(null)} />
      ) : null}
    </div>
  );
}
