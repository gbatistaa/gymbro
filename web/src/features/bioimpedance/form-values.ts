import type {
  BioimpedanceExtraction,
  BioimpedanceFormInput,
  MeasurementFieldName,
} from "@/contracts/bioimpedance";
import { nowInputValue, toZonedInputValue } from "@/lib/zoned-time";
import { METRICS } from "./metrics";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const NAIVE_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/;
const OFFSET_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;
/** Jobs antigos: o motor completava uma data sem hora com meia-noite UTC. */
const LEGACY_MIDNIGHT_UTC = /^(\d{4}-\d{2}-\d{2})T00:00(:00(\.0+)?)?Z$/;

export type ExtractedFormValues = {
  values: BioimpedanceFormInput;
  /** Campos que o laudo não trouxe; o usuário precisa conferir ou preencher. */
  missing: ReadonlySet<MeasurementFieldName>;
  /** O laudo trouxe só a data: a hora foi preenchida com 00:00. */
  isDateOnly: boolean;
};

const inputNumber = new Intl.NumberFormat("pt-BR", {
  useGrouping: false,
  maximumFractionDigits: 2,
});

function toInputNumber(value: number | null): string {
  return value === null ? "" : inputNumber.format(value);
}

/** Formulário em branco, com a data e a hora de agora no fuso do perfil. */
export function emptyFormValues(timeZone: string): BioimpedanceFormInput {
  return {
    measuredAt: nowInputValue(timeZone),
    bodyWeightKg: "",
    heightCm: "",
    bodyFatPercentage: "",
    muscleMassKg: "",
    skeletalMuscleMassKg: "",
    visceralFat: "",
    waterPercentage: "",
  };
}

type MeasuredAtInput = { value: string; isDateOnly: boolean };

function measuredAtInput(raw: string | null, timeZone: string): MeasuredAtInput {
  if (raw === null) return { value: "", isDateOnly: false };

  const text = raw.trim();
  const legacyMidnight = LEGACY_MIDNIGHT_UTC.exec(text);

  if (DATE_ONLY.test(text)) return { value: `${text}T00:00`, isDateOnly: true };
  if (legacyMidnight) return { value: `${legacyMidnight[1]}T00:00`, isDateOnly: true };
  if (NAIVE_DATE_TIME.test(text)) return { value: text.slice(0, 16), isDateOnly: false };
  if (OFFSET_DATE_TIME.test(text)) {
    return { value: toZonedInputValue(text, timeZone), isDateOnly: false };
  }
  return { value: "", isDateOnly: false };
}

/** Formulário de revisão preenchido com o que o motor leu do laudo. */
export function formValuesFromExtraction(
  extraction: BioimpedanceExtraction,
  timeZone: string,
): ExtractedFormValues {
  const measuredAt = measuredAtInput(extraction.measuredAt, timeZone);
  const missing = new Set<MeasurementFieldName>();
  if (measuredAt.value === "") missing.add("measuredAt");

  const values: BioimpedanceFormInput = {
    ...emptyFormValues(timeZone),
    measuredAt: measuredAt.value,
  };

  for (const metric of METRICS) {
    const value = extraction[metric.key];
    values[metric.key] = toInputNumber(value);
    if (value === null) missing.add(metric.key);
  }

  return { values, missing, isDateOnly: measuredAt.isDateOnly };
}
