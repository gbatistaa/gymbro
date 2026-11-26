"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Field } from "@/components/ui/field";
import {
  createBioimpedanceFormSchema,
  type BioimpedanceFormInput,
  type BioimpedancePayload,
  type MeasurementFieldName,
} from "@/contracts/bioimpedance";
import { notifyValidation } from "@/lib/notify";
import { nowInputValue } from "@/lib/zoned-time";
import styles from "./bioimpedance.module.css";
import { METRICS, type MetricDefinition } from "./metrics";

const FIELD_NAMES: readonly MeasurementFieldName[] = [
  "measuredAt",
  ...METRICS.map((metric) => metric.key),
];

const EXAMPLES: Record<MetricDefinition["key"], string> = {
  bodyWeightKg: "Ex.: 82,4",
  heightCm: "Ex.: 178",
  bodyFatPercentage: "Ex.: 18,2",
  muscleMassKg: "Ex.: 38,1",
  skeletalMuscleMassKg: "Ex.: 36",
  visceralFat: "Ex.: 8",
  waterPercentage: "Ex.: 55,3",
};

type FieldErrors = Partial<Record<MeasurementFieldName, string>>;

type MeasurementFormProps = {
  formId: string;
  timeZone: string;
  initialValues: BioimpedanceFormInput;
  /** Campos que o laudo não trouxe; ganham uma dica azul para o usuário conferir. */
  missing?: ReadonlySet<MeasurementFieldName>;
  /** Dica no campo de data, ex.: quando o laudo não informa o horário. */
  measuredAtHint?: string;
  isDisabled?: boolean;
  onSubmit: (payload: BioimpedancePayload) => void;
};

function unitLabel(metric: MetricDefinition): string {
  return `${metric.label} (${metric.unit})`;
}

function metricHint(metric: MetricDefinition, isMissing: boolean): string {
  if (isMissing) return metric.required ? "não lido · obrigatório" : "não lido no laudo";
  return metric.required ? "obrigatório" : "opcional";
}

/**
 * Campos de uma medição, com a validação espelhada do backend. Os botões ficam no rodapé do modal
 * e enviam este formulário por `form={formId}`.
 */
export function MeasurementForm({
  formId,
  timeZone,
  initialValues,
  missing,
  measuredAtHint,
  isDisabled = false,
  onSubmit,
}: MeasurementFormProps) {
  const schema = useMemo(() => createBioimpedanceFormSchema(timeZone), [timeZone]);
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [latestAllowed] = useState(() => nowInputValue(timeZone));

  function setField(name: MeasurementFieldName, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isDisabled) return;

    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = FIELD_NAMES.find((name) => name === issue.path[0]);
        if (field && !nextErrors[field]) nextErrors[field] = issue.message;
      }
      setErrors(nextErrors);
      notifyValidation(parsed.error);
      return;
    }

    setErrors({});
    onSubmit(parsed.data);
  }

  const isMeasuredAtMissing = missing?.has("measuredAt") ?? false;

  return (
    <form id={formId} onSubmit={handleSubmit} noValidate>
      <fieldset className={styles.formGrid} disabled={isDisabled}>
        <legend className={styles.srOnly}>Valores da medição</legend>

        <div className={styles.formWide}>
          <Field
            id={`${formId}-measuredAt`}
            label="Data e hora da medição"
            type="datetime-local"
            max={latestAllowed}
            hint={isMeasuredAtMissing ? "não lida no laudo · obrigatória" : measuredAtHint ?? "obrigatória"}
            hintTone={isMeasuredAtMissing || measuredAtHint ? "info" : "muted"}
            className={isMeasuredAtMissing ? styles.inputMissing : undefined}
            value={values.measuredAt}
            error={errors.measuredAt}
            onChange={(event) => setField("measuredAt", event.target.value)}
          />
        </div>

        {METRICS.map((metric) => {
          const isMissing = missing?.has(metric.key) ?? false;

          return (
            <Field
              key={metric.key}
              id={`${formId}-${metric.key}`}
              label={unitLabel(metric)}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder={EXAMPLES[metric.key]}
              hint={metricHint(metric, isMissing)}
              hintTone={isMissing ? "info" : "muted"}
              className={isMissing ? styles.inputMissing : undefined}
              value={values[metric.key]}
              error={errors[metric.key]}
              onChange={(event) => setField(metric.key, event.target.value)}
            />
          );
        })}
      </fieldset>
    </form>
  );
}
