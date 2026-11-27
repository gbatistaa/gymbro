/** Iniciais do nome para avatares, ex.: "Gabriel Batista" → "GB". */
export function initialsOf(name: string | undefined): string {
  const initials = (name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "?";
}
