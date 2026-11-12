"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { describeApiError } from "./api-error-text";

export type Resource<T> = {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  reload: () => void;
};

type Loaded<T> = {
  key: string;
  version: number;
  data: T | null;
  error: string | null;
};

/**
 * Estado de uma leitura de API: `loading | error | data`, com `reload`.
 *
 * <p>`key` identifica o pedido (ex.: `playlists:archived`). Ele é a dependência do efeito em vez do
 * loader, porque a documentação do `useEffect` exige dependências inline e estáveis — um `loader`
 * criado no render muda de identidade a cada render.
 * Fonte: https://react.dev/reference/react/useEffect#specifying-reactive-dependencies
 *
 * <p>A flag `ignore` no cleanup descarta respostas fora de ordem (race condition entre requisições).
 * Fonte: https://react.dev/reference/react/useEffect#fetching-data-with-effects
 */
export function useResource<T>(
  key: string,
  load: () => Promise<T>,
): Resource<T> {
  const loadRef = useRef(load);
  const [version, setVersion] = useState(0);
  const [loaded, setLoaded] = useState<Loaded<T> | null>(null);

  useEffect(() => {
    loadRef.current = load;
  });

  useEffect(() => {
    let ignore = false;
    loadRef.current().then(
      (result) => {
        if (!ignore) setLoaded({ key, version, data: result, error: null });
      },
      (failure: unknown) => {
        if (!ignore) {
          setLoaded({ key, version, data: null, error: describeApiError(failure) });
        }
      },
    );

    return () => {
      ignore = true;
    };
  }, [key, version]);

  const reload = useCallback(() => {
    setVersion((current) => current + 1);
  }, []);

  // loading é derivado: enquanto o resultado não corresponde ao pedido atual, não há dado válido
  const current =
    loaded !== null && loaded.key === key && loaded.version === version
      ? loaded
      : null;

  return {
    data: current === null ? null : current.data,
    error: current === null ? null : current.error,
    isLoading: current === null,
    reload,
  };
}
