import {
  MANUAL_SOURCE,
  type Bioimpedance,
  type MeasurementFieldName,
} from "@/contracts/bioimpedance";
import { formatKg, formatPercent } from "@/lib/format";

export type MetricKey = Exclude<MeasurementFieldName, "measuredAt">;

type MetricUnit = "kg" | "cm" | "%" | "nível";

export type MetricDefinition = {
  key: MetricKey;
  label: string;
  unit: MetricUnit;
  required: boolean;
  /** Faixa aceita, mostrada como dica no formulário. */
  range: string;
};

/** Ordem de exibição no formulário e no detalhe. */
export const METRICS: readonly MetricDefinition[] = [
  { key: "bodyWeightKg", label: "Peso", unit: "kg", required: false, range: "20–400" },
  { key: "heightCm", label: "Altura", unit: "cm", required: false, range: "100–250" },
  { key: "bodyFatPercentage", label: "Gordura corporal", unit: "%", required: true, range: "0–70" },
  { key: "muscleMassKg", label: "Massa muscular", unit: "kg", required: true, range: "> 0" },
  {
    key: "skeletalMuscleMassKg",
    label: "Massa muscular esquelética",
    unit: "kg",
    required: false,
    range: "> 0",
  },
  { key: "visceralFat", label: "Gordura visceral", unit: "nível", required: false, range: "0–60" },
  { key: "waterPercentage", label: "Água corporal", unit: "%", required: false, range: "0–100" },
];

export function metricLabel(key: MetricKey): string {
  return METRICS.find((metric) => metric.key === key)?.label ?? key;
}

/** Valor com unidade, ex.: `82,4 kg`, `18,2%`, `nível 8`. */
export function formatMetric(unit: MetricUnit, value: number | null | undefined): string {
  if (value == null) return "—";
  switch (unit) {
    case "%":
      return formatPercent(value);
    case "nível":
      return `nível ${formatKg(value)}`;
    default:
      return `${formatKg(value)} ${unit}`;
  }
}

/** Variação com sinal tipográfico, ex.: `+0,4 kg`, `−1,2%`, `0`. */
export function formatDelta(unit: MetricUnit, delta: number): string {
  const rounded = Math.round(delta * 10) / 10;
  const suffix = unit === "%" ? " p.p." : unit === "nível" ? "" : ` ${unit}`;
  if (rounded === 0) return `0${suffix}`;
  const sign = rounded > 0 ? "+" : "−";
  return `${sign}${formatKg(Math.abs(rounded))}${suffix}`;
}

/** IMC a partir de peso e altura, quando ambos existem. */
export function bodyMassIndex(measurement: Bioimpedance): number | null {
  const { bodyWeightKg, heightCm } = measurement;
  if (bodyWeightKg == null || heightCm == null || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  return bodyWeightKg / (heightM * heightM);
}

export function isManual(measurement: Bioimpedance): boolean {
  return measurement.source === MANUAL_SOURCE;
}

/** Rótulo curto da origem, para a lista. */
export function originBadge(measurement: Bioimpedance): string {
  if (isManual(measurement)) return "Manual";
  return measurement.sourceFileName ? "PDF" : "Importada";
}

/** Origem por extenso, para o detalhe. */
export function originDescription(measurement: Bioimpedance): string {
  if (isManual(measurement)) return "Adicionada manualmente";
  return measurement.sourceFileName ? "Importada de laudo em PDF" : "Importada";
}
