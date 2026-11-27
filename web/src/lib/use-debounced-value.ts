"use client";

import { useEffect, useState } from "react";

/** O valor só muda depois de `delayMs` sem novas alterações (ex.: busca enquanto se digita). */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
