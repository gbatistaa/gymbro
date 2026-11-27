import { toZonedInputValue, zonedInputToIso } from "./zoned-time";

/**
 * Períodos dos gráficos, calculados no fuso do perfil: "hoje" e "este mês" são os do usuário, não os
 * do aparelho nem os do UTC. Um período vai do início do primeiro dia até o início do dia seguinte
 * ao último (`to` exclusivo), como a API espera.
 */

/** Data do calendário no formato `YYYY-MM-DD`. */
export type CalendarDate = string;

export type TimeRange = {
  /** Instante ISO de início, incluído. */
  from: string;
  /** Instante ISO de fim, excluído. */
  to: string;
};

export type SeriesBucket = "DAY" | "WEEK" | "MONTH";

export type ExerciseRangePreset = "week" | "month" | "year";

export type BioRangePreset = "week" | "this-month" | "3-months" | "6-months" | "year";

const DAY_MS = 86_400_000;
const DAILY_LIMIT_DAYS = 92;
const WEEKLY_LIMIT_DAYS = 400;

function parse(date: CalendarDate): { year: number; month: number; day: number } {
  const [year, month, day] = date.split("-").map(Number);
  return { year, month, day };
}

function format(year: number, month: number, day: number): CalendarDate {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function fromUtcDate(date: Date): CalendarDate {
  return format(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

export function todayIn(timeZone: string, now: Date = new Date()): CalendarDate {
  return toZonedInputValue(now.toISOString(), timeZone).slice(0, 10);
}

export function addDays(date: CalendarDate, days: number): CalendarDate {
  const { year, month, day } = parse(date);
  return fromUtcDate(new Date(Date.UTC(year, month - 1, day + days)));
}

/** Soma meses mantendo o dia, ou o último dia do mês quando ele é mais curto (31/03 − 1 mês = 28/02). */
export function addMonths(date: CalendarDate, months: number): CalendarDate {
  const { year, month, day } = parse(date);
  const firstOfTarget = new Date(Date.UTC(year, month - 1 + months, 1));
  const targetYear = firstOfTarget.getUTCFullYear();
  const targetMonth = firstOfTarget.getUTCMonth() + 1;
  const lastDay = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate();
  return format(targetYear, targetMonth, Math.min(day, lastDay));
}

function startOfDay(date: CalendarDate, timeZone: string): string {
  const iso = zonedInputToIso(`${date}T00:00`, timeZone);
  if (iso === null) {
    throw new RangeError(`Invalid calendar date: ${date}`);
  }
  return iso;
}

/** Do início de `firstDay` até o início do dia seguinte a `lastDay`, no fuso informado. */
export function calendarRange(firstDay: CalendarDate, lastDay: CalendarDate, timeZone: string): TimeRange {
  return {
    from: startOfDay(firstDay, timeZone),
    to: startOfDay(addDays(lastDay, 1), timeZone),
  };
}

/** Os últimos `months` meses até hoje, sem repetir o dia de hoje no mês de início. */
function monthsBack(months: number, timeZone: string, now: Date): TimeRange {
  const today = todayIn(timeZone, now);
  return calendarRange(addDays(addMonths(today, -months), 1), today, timeZone);
}

function lastSevenDays(timeZone: string, now: Date): TimeRange {
  const today = todayIn(timeZone, now);
  return calendarRange(addDays(today, -6), today, timeZone);
}

export function exercisePresetRange(
  preset: ExerciseRangePreset,
  timeZone: string,
  now: Date = new Date(),
): TimeRange {
  switch (preset) {
    case "week":
      return lastSevenDays(timeZone, now);
    case "month":
      return monthsBack(1, timeZone, now);
    case "year":
      return monthsBack(12, timeZone, now);
  }
}

export function bioPresetRange(
  preset: BioRangePreset,
  timeZone: string,
  now: Date = new Date(),
): TimeRange {
  switch (preset) {
    case "week":
      return lastSevenDays(timeZone, now);
    case "this-month": {
      const today = todayIn(timeZone, now);
      return calendarRange(`${today.slice(0, 8)}01`, today, timeZone);
    }
    case "3-months":
      return monthsBack(3, timeZone, now);
    case "6-months":
      return monthsBack(6, timeZone, now);
    case "year":
      return monthsBack(12, timeZone, now);
  }
}

/** Granularidade que mantém o gráfico legível: dias até ~3 meses, semanas até ~1 ano, meses depois. */
export function bucketForRange(range: TimeRange): SeriesBucket {
  const days = Math.round((Date.parse(range.to) - Date.parse(range.from)) / DAY_MS);
  if (days <= DAILY_LIMIT_DAYS) return "DAY";
  if (days <= WEEKLY_LIMIT_DAYS) return "WEEK";
  return "MONTH";
}
