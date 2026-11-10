import { useEffect, useState } from 'react';

/**
 * Devolve `value` com atraso: só atualiza quando ele ficar parado por `delayMs`.
 *
 * Na busca, cada tecla dispara um request sem isto. 400ms é o meio-termo entre "responde rápido"
 * e "não consulta a cada letra".
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
