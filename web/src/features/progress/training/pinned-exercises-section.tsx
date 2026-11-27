"use client";

import { Pin } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SortableList } from "@/components/ui/sortable-list";
import { Skeleton } from "@/components/ui/skeleton";
import { SurfaceCard } from "@/components/ui/surface-card";
import { MAX_PINNED_EXERCISES, type PinnedExercise } from "@/contracts/progress";
import { bucketForRange, exercisePresetRange, type ExerciseRangePreset } from "@/lib/date-ranges";
import { notifyApiError } from "@/lib/notify";
import type { Resource } from "@/lib/use-resource";
import styles from "../progress.module.css";
import type { EvolutionTarget } from "./exercise-evolution-modal";
import { savePinnedExercises } from "../progress-api";
import { PinExercisesModal } from "./pin-exercises-modal";
import { PinnedExerciseCard } from "./pinned-exercise-card";
import { PRESET_OPTIONS } from "./range-picker";

type PinnedExercisesSectionProps = {
  pinned: Resource<PinnedExercise[]>;
  timeZone: string;
  onPinnedChange: () => void;
  onOpenExercise: (exercise: EvolutionTarget) => void;
};

/** Até 4 gráficos de exercícios escolhidos pelo usuário, com um período comum. */
export function PinnedExercisesSection({ pinned, timeZone, onPinnedChange, onOpenExercise }: PinnedExercisesSectionProps) {
  const [preset, setPreset] = useState<ExerciseRangePreset>("month");
  const [isPicking, setIsPicking] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const range = exercisePresetRange(preset, timeZone);
  const bucket = bucketForRange(range);
  const exercises = pinned.data ?? pinned.lastData;

  /** A nova ordem aparece na hora e é gravada em seguida; se falhar, volta ao que está salvo. */
  async function handleReorder(next: PinnedExercise[]) {
    pinned.replace(next.map((exercise, position) => ({ ...exercise, position })));
    setIsSavingOrder(true);
    try {
      pinned.replace(await savePinnedExercises(next.map((exercise) => exercise.exerciseId)));
    } catch (failure) {
      notifyApiError(failure);
      pinned.reload();
    } finally {
      setIsSavingOrder(false);
    }
  }

  function handleSaved() {
    setIsPicking(false);
    onPinnedChange();
  }

  return (
    <section className={styles.section} aria-labelledby="pinned-title">
      <div className={styles.sectionHeader}>
        <h2 id="pinned-title" className={styles.sectionTitle}>Exercícios fixados</h2>
        <Button variant="ghost" size="sm" onClick={() => setIsPicking(true)} disabled={exercises === null}>
          <Pin size={15} strokeWidth={1.75} aria-hidden="true" />
          {exercises && exercises.length > 0 ? "Editar" : "Fixar"}
        </Button>
      </div>

      {pinned.error ? (
        <ErrorState message={pinned.error} onRetry={pinned.reload} />
      ) : exercises === null ? (
        <Skeleton lines={4} label="Carregando exercícios fixados…" />
      ) : exercises.length === 0 ? (
        <SurfaceCard className={styles.pinnedEmpty}>
          <Pin size={20} strokeWidth={1.75} className={styles.pinnedEmptyIcon} aria-hidden="true" />
          <p className={styles.pinnedEmptyText}>
            Fixe até {MAX_PINNED_EXERCISES} exercícios para acompanhar carga, repetições, séries e volume aqui.
          </p>
          <Button variant="secondary" size="sm" onClick={() => setIsPicking(true)}>
            Escolher exercícios
          </Button>
        </SurfaceCard>
      ) : (
        <>
          <SegmentedControl legend="Período dos fixados" options={PRESET_OPTIONS} value={preset} onChange={setPreset} size="sm" />
          <SortableList
            items={exercises}
            getId={(exercise) => exercise.exerciseId}
            getLabel={(exercise) => `gráfico de ${exercise.name}`}
            onReorder={handleReorder}
            disabled={isSavingOrder}
            renderItem={(exercise, dragHandle) => (
              <PinnedExerciseCard
                exercise={exercise}
                range={range}
                bucket={bucket}
                timeZone={timeZone}
                onOpen={() => onOpenExercise(exercise)}
                dragHandle={dragHandle}
              />
            )}
          />
        </>
      )}

      {isPicking && exercises !== null ? (
        <PinExercisesModal initial={exercises} onSaved={handleSaved} onClose={() => setIsPicking(false)} />
      ) : null}
    </section>
  );
}
