/**
 * Conversão entre um instante (ISO-8601 com fuso) e o valor de um `<input type="datetime-local">`
 * (`YYYY-MM-DDTHH:mm`) lido no fuso do perfil do usuário, que pode diferir do fuso do aparelho.
 */

const LOCAL_INPUT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

type WallTime = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

function wallTimeAt(instant: number, timeZone: string): WallTime {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(instant));

  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((item) => item.type === type)?.value ?? "0");

  return {
    year: part("year"),
    month: part("month"),
    day: part("day"),
    hour: part("hour"),
    minute: part("minute"),
  };
}

function wallTimeAsUtc(wall: WallTime): number {
  return Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute);
}

/** Diferença, em ms, entre o relógio do fuso e o UTC naquele instante. */
function offsetAt(instant: number, timeZone: string): number {
  const truncated = Math.floor(instant / 60_000) * 60_000;
  return wallTimeAsUtc(wallTimeAt(truncated, timeZone)) - truncated;
}

function pad(value: number, length = 2): string {
  return String(value).padStart(length, "0");
}

function formatWallTime(wall: WallTime): string {
  return `${pad(wall.year, 4)}-${pad(wall.month)}-${pad(wall.day)}T${pad(wall.hour)}:${pad(wall.minute)}`;
}

/** Instante → `YYYY-MM-DDTHH:mm` no fuso informado. */
export function toZonedInputValue(iso: string, timeZone: string): string {
  return formatWallTime(wallTimeAt(new Date(iso).getTime(), timeZone));
}

/** Agora, como valor de `datetime-local` no fuso informado. */
export function nowInputValue(timeZone: string): string {
  return formatWallTime(wallTimeAt(Date.now(), timeZone));
}

/**
 * `YYYY-MM-DDTHH:mm` no fuso informado → instante ISO em UTC. Devolve `null` para valor mal
 * formado ou data inexistente (ex.: 31/02).
 */
export function zonedInputToIso(value: string, timeZone: string): string | null {
  const match = LOCAL_INPUT.exec(value.trim());
  if (!match) return null;

  const [, year, month, day, hour, minute] = match.map(Number);
  const wall: WallTime = { year, month, day, hour, minute };
  const asUtc = wallTimeAsUtc(wall);

  // O offset depende do próprio instante (horário de verão): calcula, corrige e confere de novo.
  let instant = asUtc - offsetAt(asUtc, timeZone);
  const corrected = asUtc - offsetAt(instant, timeZone);
  if (corrected !== instant) instant = corrected;

  const roundTrip = wallTimeAt(instant, timeZone);
  const sameCalendarDay =
    roundTrip.year === wall.year && roundTrip.month === wall.month && roundTrip.day === wall.day;

  return sameCalendarDay ? new Date(instant).toISOString() : null;
}
