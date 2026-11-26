export type TimeZoneOption = {
  value: string;
  label: string;
};

/** Common Brazilian zones plus a few references. Any valid IANA zone is still accepted by the API. */
export const TIME_ZONE_OPTIONS: readonly TimeZoneOption[] = [
  { value: "America/Sao_Paulo", label: "Brasília (São Paulo)" },
  { value: "America/Cuiaba", label: "Cuiabá" },
  { value: "America/Manaus", label: "Manaus" },
  { value: "America/Rio_Branco", label: "Rio Branco" },
  { value: "America/Fortaleza", label: "Fortaleza" },
  { value: "America/Recife", label: "Recife" },
  { value: "America/Belem", label: "Belém" },
  { value: "America/Noronha", label: "Fernando de Noronha" },
  { value: "America/New_York", label: "New York" },
  { value: "Europe/Lisbon", label: "Lisbon" },
  { value: "UTC", label: "UTC" },
];

export function isKnownTimeZone(value: string): boolean {
  try {
    Intl.DateTimeFormat("en-US", { timeZone: value }).format(0);
    return true;
  } catch {
    return false;
  }
}

/** Selector options, including the user's current zone even when it is not in the list. */
export function timeZoneOptionsWithCurrent(current: string): readonly TimeZoneOption[] {
  return TIME_ZONE_OPTIONS.some((option) => option.value === current)
    ? TIME_ZONE_OPTIONS
    : [{ value: current, label: current }, ...TIME_ZONE_OPTIONS];
}

export function timeZoneLabel(value: string): string {
  return TIME_ZONE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}
