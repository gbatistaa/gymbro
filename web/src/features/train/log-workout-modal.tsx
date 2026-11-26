"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { completionSchema, type Completion } from "@/contracts/completion";
import { playlistDetailSchema, type PlaylistDetail } from "@/contracts/playlist";
import { request } from "@/lib/http";
import { notifyApiError, notifyErrors } from "@/lib/notify";
import { useResource } from "@/lib/use-resource";
import { entryErrorMessages, entryFromPlanItem, validateEntries } from "./exercise-entries";
import { ExerciseEntryList } from "./exercise-entry-list";
import { ExerciseSearch } from "./exercise-search";
import styles from "./plans.module.css";
import { useExerciseEntries } from "./use-exercise-entries";

type LogWorkoutModalProps = {
  planId: string;
  planName: string;
  onLogged: (completion: Completion) => void;
  onClose: () => void;
};

/** Registra o que foi executado para uma rotina: carga, séries e repetições por exercício. */
export function LogWorkoutModal({ planId, planName, onLogged, onClose }: LogWorkoutModalProps) {
  const plan = useResource(`plan:${planId}`, () =>
    request({ url: `/api/playlists/${planId}` }, playlistDetailSchema),
  );

  return (
    <Modal
      title={`Registrar treino · ${planName}`}
      description="Ajuste o que você realmente executou hoje. Cada série soma no seu volume e recordes."
      size="large"
      onClose={onClose}
    >
      {plan.isLoading ? (
        <Skeleton lines={4} label="Carregando rotina…" />
      ) : plan.error || !plan.data ? (
        <ErrorState
          message={plan.error ?? "Não foi possível carregar a rotina."}
          onRetry={plan.reload}
        />
      ) : (
        <LogWorkoutForm plan={plan.data} onLogged={onLogged} onClose={onClose} />
      )}
    </Modal>
  );
}

type LogWorkoutFormProps = {
  plan: PlaylistDetail;
  onLogged: (completion: Completion) => void;
  onClose: () => void;
};

function LogWorkoutForm({ plan, onLogged, onClose }: LogWorkoutFormProps) {
  const exercises = useExerciseEntries(plan.exercises.map(entryFromPlanItem));
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function save() {
    if (isSaving) return;

    const validated = validateEntries(exercises.entries);
    if (!validated.ok) {
      exercises.setErrors(validated.errors);
      notifyErrors(entryErrorMessages(exercises.entries, validated.errors));
      return;
    }

    exercises.setErrors({});
    setIsSaving(true);

    try {
      const completion = await request(
        {
          method: "POST",
          url: `/api/playlists/${plan.id}/completions`,
          data: { exercises: validated.values },
        },
        completionSchema,
      );
      onLogged(completion);
    } catch (failure) {
      notifyApiError(failure);
    } finally {
      setIsSaving(false);
    }
  }

  const hasExercises = exercises.entries.length > 0;

  return (
    <>
      <p className={styles.sectionTitle}>Exercícios executados · {exercises.entries.length}</p>
      <ExerciseEntryList
        entries={exercises.entries}
        errors={exercises.errors}
        emptyText="Esta rotina não tem exercícios. Adicione o que você fez ou apenas marque como concluída."
        onChange={exercises.update}
        onRemove={exercises.remove}
      />

      {isAdding ? (
        <ExerciseSearch
          excludedIds={exercises.excludedIds}
          onSelect={(exercise) => {
            exercises.add(exercise);
            setIsAdding(false);
          }}
        />
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsAdding(true)}
        >
          <Plus size={15} aria-hidden="true" />
          Adicionar outro exercício
        </Button>
      )}

      <div className={styles.modalBottomActions}>
        <Button variant="secondary" onClick={onClose} disabled={isSaving}>
          Cancelar
        </Button>
        <Button onClick={save} isLoading={isSaving}>
          {hasExercises ? "Salvar treino" : "Marcar como feito"}
        </Button>
      </div>
    </>
  );
}
