import type { SeriesBucket } from "@/lib/date-ranges";
import { formatDate, formatMonthYear, formatShortDate } from "@/lib/format";

/** Período de um ponto da série por extenso, conforme a granularidade. */
export function formatPeriod(periodStartMs: number, bucket: SeriesBucket, timeZone: string): string {
  const iso = new Date(periodStartMs).toISOString();
  switch (bucket) {
    case "DAY":
      return formatDate(iso, timeZone);
    case "WEEK":
      return `Semana de ${formatShortDate(iso, timeZone)}`;
    case "MONTH":
      return formatMonthYear(iso, timeZone);
  }
}

/** Data curta para as pontas do eixo X, ex.: `3 de nov.`. */
export function formatAxisDate(ms: number, timeZone: string): string {
  return formatShortDate(new Date(ms).toISOString(), timeZone);
}

export const BUCKET_LABEL: Record<SeriesBucket, string> = {
  DAY: "por dia",
  WEEK: "por semana",
  MONTH: "por mês",
};
