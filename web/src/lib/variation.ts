/** Variação de um valor ao longo de um período, em porcentagem. */

export type VariationDirection = "up" | "down" | "flat";

const EMPTY = "—";
const percent = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

/** Variação do primeiro para o último valor, em % do primeiro. `null` sem base de comparação. */
export function percentChange(
  first: number | null | undefined,
  last: number | null | undefined,
): number | null {
  if (first == null || last == null || first === 0) return null;
  return ((last - first) / Math.abs(first)) * 100;
}

/**
 * Arredonda como aparece na tela (a metade se afasta do zero, como no `Intl`), para que o sinal e a
 * seta concordem com o número mostrado.
 */
function rounded(value: number): number {
  const result = (Math.sign(value) * Math.round(Math.abs(value) * 10)) / 10;
  return result === 0 ? 0 : result;
}

export function variationDirection(value: number | null | undefined): VariationDirection {
  if (value == null) return "flat";
  const shown = rounded(value);
  return shown > 0 ? "up" : shown < 0 ? "down" : "flat";
}

/** `+4,8%`, `−1,3%`, `0%`; traço quando não há valor. */
export function formatSignedPercent(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return EMPTY;
  const shown = rounded(value);
  if (shown === 0) return "0%";
  return `${shown > 0 ? "+" : "−"}${percent.format(Math.abs(shown))}%`;
}
