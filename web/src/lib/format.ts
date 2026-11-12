const EMPTY = "—";

const decimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

function isFiniteNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** `Intl` formata `-0` como "-0"; o sinal não deve vazar para a tela. */
function normalize(value: number): number {
  return Object.is(value, -0) ? 0 : value;
}

export function formatKg(value: number | null | undefined): string {
  return isFiniteNumber(value) ? decimal.format(normalize(value)) : EMPTY;
}

export function formatVolume(valueKg: number | null | undefined): string {
  return isFiniteNumber(valueKg)
    ? `${decimal.format(normalize(valueKg))} kg`
    : EMPTY;
}

export function formatPercent(value: number | null | undefined): string {
  return isFiniteNumber(value) ? `${decimal.format(normalize(value))}%` : EMPTY;
}

export function formatCount(value: number | null | undefined): string {
  return isFiniteNumber(value) ? integer.format(normalize(value)) : EMPTY;
}

/** Data no fuso do usuário, `dd/mm/aaaa`. */
export function formatDate(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

/** Data e hora no fuso do usuário, `dd/mm/aaaa hh:mm`. */
export function formatDateTime(iso: string, timeZone: string): string {
  const time = new Intl.DateTimeFormat("pt-BR", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

  return `${formatDate(iso, timeZone)} ${time}`;
}

/** Duração em segundos: `1h 12min`, `48min`, `30s`. */
export function formatDuration(totalSeconds: number | null | undefined): string {
  if (!isFiniteNumber(totalSeconds) || totalSeconds < 0) {
    return EMPTY;
  }

  const seconds = Math.round(totalSeconds);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
  }
  if (minutes > 0) {
    return `${minutes}min`;
  }
  return `${seconds}s`;
}

/** Dia do calendário no fuso do usuário, como número de dias desde a época. */
function calendarDay(iso: string, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso));

  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((item) => item.type === type)?.value ?? "0");

  return Math.round(
    Date.UTC(part("year"), part("month") - 1, part("day")) / 86_400_000,
  );
}

/** `hoje`, `ontem`, `há 6 d`, `há 2 sem`, `há 3 m`, `há 1 a`. */
export function formatRelative(
  iso: string,
  timeZone: string,
  now: Date = new Date(),
): string {
  const days = calendarDay(now.toISOString(), timeZone) -
    calendarDay(iso, timeZone);

  if (days < 0) return "agora";
  if (days === 0) return "hoje";
  if (days === 1) return "ontem";
  if (days < 14) return `há ${days} d`;
  if (days < 60) return `há ${Math.floor(days / 7)} sem`;
  if (days < 365) return `há ${Math.floor(days / 30)} m`;
  return `há ${Math.floor(days / 365)} a`;
}
