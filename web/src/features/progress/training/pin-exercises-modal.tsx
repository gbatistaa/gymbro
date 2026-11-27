"use client";

import { Check, X } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Field } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { MAX_PINNED_EXERCISES, type PinnedExercise } from "@/contracts/progress";
import { formatCount } from "@/lib/format";
import { notifyApiError, notifySuccess } from "@/lib/notify";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { useResource } from "@/lib/use-resource";
import { fetchExerciseProgress, savePinnedExercises } from "../progress-api";
import styles from "../progress.module.css";

type Candidate = Pick<PinnedExercise, "exerciseId" | "name" | "primaryMuscle">;

type PinExercisesModalProps = {
  initial: readonly PinnedExercise[];
  onSaved: (pinned: PinnedExercise[]) => void;
  onClose: () => void;
};

const SEARCH_PAGE_SIZE = 20;

/** Escolha de até 4 exercícios já treinados; a ordem de escolha é a ordem dos gráficos. */
export function PinExercisesModal({ initial, onSaved, onClose }: PinExercisesModalProps) {
  const searchId = useId();
  const [selected, setSelected] = useState<Candidate[]>(() =>
    initial.map(({ exerciseId, name, primaryMuscle }) => ({ exerciseId, name, primaryMuscle })),
  );
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const candidates = useResource(`progress:pin-candidates:${debouncedSearch}`, () =>
    fetchExerciseProgress({
      search: debouncedSearch,
      muscle: "",
      sort: "NAME",
      direction: "ASC",
      page: 0,
      size: SEARCH_PAGE_SIZE,
    }),
  );
  const page = candidates.data ?? candidates.lastData;
  const isFull = selected.length >= MAX_PINNED_EXERCISES;

  function toggle(candidate: Candidate) {
    setSelected((current) =>
      current.some((item) => item.exerciseId === candidate.exerciseId)
        ? current.filter((item) => item.exerciseId !== candidate.exerciseId)
        : current.length < MAX_PINNED_EXERCISES ? [...current, candidate] : current,
    );
  }

  async function handleSave() {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const saved = await savePinnedExercises(selected.map((item) => item.exerciseId));
      notifySuccess(saved.length > 0 ? "Exercícios fixados atualizados." : "Nenhum exercício fixado.");
      onSaved(saved);
    } catch (failure) {
      notifyApiError(failure);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal
      title="Fixar exercícios"
      description={`Escolha até ${MAX_PINNED_EXERCISES}. Eles aparecem no topo do painel, nesta ordem.`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} isLoading={isSaving}>
            Salvar
          </Button>
        </>
      }
    >
      <div className={styles.pinPicker}>
        <div className={styles.pinSelected} aria-live="polite">
          <span className={styles.pinCounter}>
            {formatCount(selected.length)} de {MAX_PINNED_EXERCISES} selecionados
          </span>
          {selected.length > 0 ? (
            <ol className={styles.pinChips}>
              {selected.map((item, index) => (
                <li key={item.exerciseId} className={styles.pinChip}>
                  <span className={styles.pinChipOrder}>{index + 1}</span>
                  <span className={styles.pinChipName}>{item.name}</span>
                  <button
                    type="button"
                    className={styles.pinChipRemove}
                    aria-label={`Tirar ${item.name}`}
                    onClick={() => toggle(item)}
                  >
                    <X size={14} strokeWidth={2} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ol>
          ) : null}
        </div>

        <Field
          id={searchId}
          label="Buscar exercício"
          type="search"
          placeholder="Ex.: supino"
          autoComplete="off"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        {candidates.error ? (
          <ErrorState message={candidates.error} onRetry={candidates.reload} />
        ) : page === null ? (
          <Skeleton lines={4} label="Carregando exercícios…" />
        ) : page.content.length === 0 ? (
          <p className={styles.pinEmpty}>
            {debouncedSearch
              ? "Nenhum exercício treinado com esse nome."
              : "Registre um treino para poder fixar exercícios."}
          </p>
        ) : (
          <ul className={styles.pinOptions} aria-busy={candidates.isLoading || undefined}>
            {page.content.map((candidate) => {
              const isChecked = selected.some((item) => item.exerciseId === candidate.exerciseId);
              const isDisabled = isFull && !isChecked;
              return (
                <li key={candidate.exerciseId}>
                  <label className={[styles.pinOption, isDisabled ? styles.pinOptionDisabled : null].filter(Boolean).join(" ")}>
                    <input
                      type="checkbox"
                      className={styles.pinCheckbox}
                      checked={isChecked}
                      disabled={isDisabled}
                      onChange={() => toggle(candidate)}
                    />
                    <span className={styles.pinCheckmark} aria-hidden="true">
                      {isChecked ? <Check size={14} strokeWidth={2.5} /> : null}
                    </span>
                    <span className={styles.pinOptionText}>
                      <span className={styles.pinOptionName}>{candidate.name}</span>
                      <span className={styles.pinOptionMuscle}>{candidate.primaryMuscle}</span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}

        {page !== null && page.totalElements > page.content.length ? (
          <p className={styles.pinHint}>
            Mostrando {formatCount(page.content.length)} de {formatCount(page.totalElements)}. Refine a busca para encontrar outros.
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
