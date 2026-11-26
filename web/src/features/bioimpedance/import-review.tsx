"use client";

import { Info } from "lucide-react";
import { useState } from "react";
import {
  bioimpedanceExtractionSchema,
  type BioimpedancePayload,
  type ImportJob,
} from "@/contracts/bioimpedance";
import { formValuesFromExtraction, type ExtractedFormValues } from "./form-values";
import { MeasurementForm } from "./measurement-form";
import styles from "./bioimpedance.module.css";

/** Resultado fora do formato vira formulário vazio: o usuário preenche tudo na revisão. */
function readExtraction(job: ImportJob, timeZone: string): ExtractedFormValues {
  const parsed = bioimpedanceExtractionSchema.safeParse(job.result ?? {});
  const extraction = parsed.success ? parsed.data : bioimpedanceExtractionSchema.parse({});
  return formValuesFromExtraction(extraction, timeZone);
}

function missingText(count: number): string {
  if (count === 0) return "Todos os campos foram encontrados.";
  if (count === 1) return "1 campo não foi encontrado e está marcado em azul.";
  return `${count} campos não foram encontrados e estão marcados em azul.`;
}

type ImportReviewProps = {
  formId: string;
  job: ImportJob;
  timeZone: string;
  isSaving: boolean;
  onSubmit: (payload: BioimpedancePayload) => void;
};

/** Revisão obrigatória: o motor é heurístico, então nada é salvo sem o usuário conferir. */
export function ImportReview({ formId, job, timeZone, isSaving, onSubmit }: ImportReviewProps) {
  const [extracted] = useState(() => readExtraction(job, timeZone));

  return (
    <>
      <div className={styles.callout}>
        <Info size={18} strokeWidth={1.75} aria-hidden="true" />
        <p>
          Valores lidos de <strong className={styles.calloutFile}>{job.sourceFileName}</strong>.
          Confira cada campo antes de salvar. {missingText(extracted.missing.size)}
        </p>
      </div>

      <MeasurementForm
        formId={formId}
        timeZone={timeZone}
        initialValues={extracted.values}
        missing={extracted.missing}
        measuredAtHint={extracted.isDateOnly ? "laudo sem horário · confira" : undefined}
        isDisabled={isSaving}
        onSubmit={onSubmit}
      />
    </>
  );
}
