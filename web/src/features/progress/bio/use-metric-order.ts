"use client";

import { useState } from "react";
import { z } from "zod";

const STORAGE_KEY = "gymbro.progress.bio-order";
const orderSchema = z.array(z.string());

function read(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw === null ? null : orderSchema.safeParse(JSON.parse(raw));
    return parsed !== null && parsed.success ? parsed.data : [];
  } catch {
    // armazenamento bloqueado ou JSON inválido: segue a ordem padrão
    return [];
  }
}

/**
 * Ordem dos gráficos de bioimpedância escolhida pelo usuário. É uma preferência deste aparelho,
 * por isso fica no navegador e não na API. Sem armazenamento disponível, vale a ordem padrão.
 */
export function useMetricOrder(): [readonly string[], (order: readonly string[]) => void] {
  const [order, setOrder] = useState<readonly string[]>(read);

  function save(next: readonly string[]) {
    setOrder(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // a ordem vale até recarregar a página
    }
  }

  return [order, save];
}
