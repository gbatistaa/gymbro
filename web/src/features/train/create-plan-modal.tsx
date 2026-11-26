"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Notice } from "@/components/ui/notice";
import { planFormSchema } from "@/contracts/exercise-entry";
import { playlistSchema } from "@/contracts/playlist";
import { describeApiError } from "@/lib/api-error-text";
import { request } from "@/lib/http";
import { validateEntries } from "./exercise-entries";
import { ExerciseEntryList } from "./exercise-entry-list";
import { ExerciseSearch } from "./exercise-search";
import styles from "./plans.module.css";
import { useExerciseEntries } from "./use-exercise-entries";

const FORM_ID = "create-plan-form";

type PlanFieldErrors = Partial<Record<"name" | "description", string>>;

type CreatePlanModalProps = {
  onCreated: (planId: string) => void;
  onClose: () => void;
};

export function CreatePlanModal({ onCreated, onClose }: CreatePlanModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fieldErrors, setFieldErrors] = useState<PlanFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const exercises = useExerciseEntries();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    const validatedEntries = validateEntries(exercises.entries);
    const parsed = planFormSchema.safeParse({
      name,
      description,
      exercises: validatedEntries.ok ? validatedEntries.values : [],
    });

    const nextFieldErrors: PlanFieldErrors = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if ((field === "name" || field === "description") && !nextFieldErrors[field]) {
          nextFieldErrors[field] = issue.message;
        }
      }
    }
    setFieldErrors(nextFieldErrors);
    exercises.setErrors(validatedEntries.ok ? {} : validatedEntries.errors);

    if (!parsed.success || !validatedEntries.ok) return;

    setFormError(null);
    setIsSaving(true);

    try {
      const plan = await request(
        {
          method: "POST",
          url: "/api/playlists",
          data: {
            name: parsed.data.name,
            description: parsed.data.description || null,
            exercises: parsed.data.exercises.map((entry) => ({
              exerciseId: entry.exerciseId,
              targetSets: entry.sets,
              targetRepsMin: entry.reps,
              targetRepsMax: entry.reps,
              targetWeightKg: entry.weightKg,
            })),
          },
        },
        playlistSchema,
      );
      onCreated(plan.id);
    } catch (failure) {
      setFormError(describeApiError(failure));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal
      title="Nova rotina de treino"
      description="Defina o nome da rotina e liste os exercícios com carga, séries e repetições."
      size="large"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="submit" form={FORM_ID} isLoading={isSaving}>
            Criar rotina
          </Button>
        </>
      }
    >
      {formError ? <Notice tone="error">{formError}</Notice> : null}

      <form id={FORM_ID} className={styles.formStack} onSubmit={handleSubmit} noValidate>
        <Field
          id="plan-name"
          label="Nome da rotina"
          placeholder="Ex.: Treino A — Superiores"
          maxLength={120}
          autoFocus
          value={name}
          error={fieldErrors.name}
          onChange={(event) => setName(event.target.value)}
        />
        <Field
          id="plan-description"
          label="Descrição"
          hint="Opcional"
          placeholder="Ex.: Foco em peitoral, costas e ombros"
          maxLength={500}
          value={description}
          error={fieldErrors.description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </form>

      <p className={styles.sectionTitle}>Exercícios na rotina · {exercises.entries.length}</p>
      <ExerciseEntryList
        entries={exercises.entries}
        errors={exercises.errors}
        emptyText="Nenhum exercício ainda. Adicione-os pela busca abaixo."
        onChange={exercises.update}
        onRemove={exercises.remove}
      />

      <p className={styles.sectionTitle}>Adicionar exercícios</p>
      <ExerciseSearch excludedIds={exercises.excludedIds} onSelect={exercises.add} />
    </Modal>
  );
}
