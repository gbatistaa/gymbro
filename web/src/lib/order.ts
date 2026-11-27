/**
 * Ordena `items` pela ordem salva (lista de chaves). O que não está na lista vai para o fim, na
 * ordem original; chaves salvas que não existem mais são ignoradas.
 */
export function applyOrder<T>(
  items: readonly T[],
  keyOf: (item: T) => string,
  savedOrder: readonly string[],
): T[] {
  const byKey = new Map(items.map((item) => [keyOf(item), item]));
  const placed = new Set<string>();
  const ordered: T[] = [];

  for (const key of savedOrder) {
    const item = byKey.get(key);
    if (item !== undefined && !placed.has(key)) {
      placed.add(key);
      ordered.push(item);
    }
  }
  for (const item of items) {
    if (!placed.has(keyOf(item))) ordered.push(item);
  }
  return ordered;
}
