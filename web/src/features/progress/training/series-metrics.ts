import type { SeriesPoint } from "@/contracts/progress";
import { formatCompact, formatCount, formatKg, formatVolume } from "@/lib/format";

export type SeriesMetricKey = "maxWeight" | "bestE1rm" | "volume" | "sets" | "reps";

export type SeriesMetric = {
  key: SeriesMetricKey;
  label: string;
  /** Rótulo curto, para o seletor. */
  shortLabel: string;
  read: (point: SeriesPoint) => number;
  format: (value: number) => string;
  formatTick: (value: number) => string;
  /** Unidade depois do número na variação, ex.: ` kg`. */
  unitSuffix: string;
};

const kg = (value: number): string => `${formatKg(value)} kg`;

export const SERIES_METRICS: readonly SeriesMetric[] = [
  {
    key: "maxWeight",
    label: "Carga máxima",
    shortLabel: "Carga",
    read: (point) => point.maxWeight,
    format: kg,
    formatTick: formatKg,
    unitSuffix: " kg",
  },
  {
    key: "bestE1rm",
    label: "1RM estimado",
    shortLabel: "1RM",
    read: (point) => point.bestE1rm,
    format: kg,
    formatTick: formatKg,
    unitSuffix: " kg",
  },
  {
    key: "volume",
    label: "Volume",
    shortLabel: "Volume",
    read: (point) => point.volume,
    format: formatVolume,
    formatTick: formatCompact,
    unitSuffix: " kg",
  },
  {
    key: "sets",
    label: "Séries",
    shortLabel: "Séries",
    read: (point) => point.sets,
    format: (value) => `${formatCount(value)} ${value === 1 ? "série" : "séries"}`,
    formatTick: formatCount,
    unitSuffix: "",
  },
  {
    key: "reps",
    label: "Repetições",
    shortLabel: "Reps",
    read: (point) => point.reps,
    format: (value) => `${formatCount(value)} reps`,
    formatTick: formatCount,
    unitSuffix: "",
  },
];

/** Os quatro do cartão fixado: séries, carga, repetições e volume. */
export const PINNED_METRIC_KEYS: readonly SeriesMetricKey[] = ["maxWeight", "reps", "sets", "volume"];

export function seriesMetric(key: SeriesMetricKey): SeriesMetric {
  const metric = SERIES_METRICS.find((candidate) => candidate.key === key);
  if (!metric) throw new Error(`Unknown series metric: ${key}`);
  return metric;
}

/** Variação com sinal tipográfico, ex.: `+5 kg`, `−2 reps`, `0`. */
export function formatSignedChange(metric: SeriesMetric, change: number): string {
  const rounded = Math.round(change * 10) / 10;
  if (rounded === 0) return `0${metric.unitSuffix}`;
  const sign = rounded > 0 ? "+" : "−";
  const magnitude = metric.key === "volume" ? formatCompact(Math.abs(rounded)) : formatKg(Math.abs(rounded));
  return `${sign}${magnitude}${metric.unitSuffix}`;
}
