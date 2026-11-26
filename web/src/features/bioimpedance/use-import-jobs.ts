"use client";

import { useCallback, useEffect, useState } from "react";
import type { ImportJob } from "@/contracts/bioimpedance";
import { describeApiError } from "@/lib/api-error-text";
import { listOpenImports } from "./api";

/** Intervalo de consulta enquanto algum laudo está na fila ou sendo lido. */
const POLL_INTERVAL_MS = 2_000;

export function isProcessing(job: ImportJob): boolean {
  return job.status === "PENDING" || job.status === "PROCESSING";
}

export type ImportJobs = {
  jobs: ImportJob[] | null;
  error: string | null;
  reload: () => void;
  /** Mostra um job recém-enviado sem esperar a próxima consulta. */
  add: (job: ImportJob) => void;
  remove: (jobId: string) => void;
};

/**
 * Importações em aberto do usuário. Enquanto houver laudo na fila ou sendo lido, consulta o
 * backend a cada {@link POLL_INTERVAL_MS}; uma falha de rede no meio do processamento não
 * interrompe as consultas.
 */
export function useImportJobs(): ImportJobs {
  const [jobs, setJobs] = useState<ImportJob[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let ignore = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let isPolling = false;

    async function load() {
      try {
        const result = await listOpenImports();
        if (ignore) return;
        setJobs(result);
        setError(null);
        isPolling = result.some(isProcessing);
      } catch (failure) {
        if (ignore) return;
        setError(describeApiError(failure));
      }

      if (isPolling && !ignore) timer = setTimeout(load, POLL_INTERVAL_MS);
    }

    load();

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [version]);

  const reload = useCallback(() => setVersion((current) => current + 1), []);

  const add = useCallback(
    (job: ImportJob) => {
      setJobs((current) => [job, ...(current ?? []).filter((item) => item.id !== job.id)]);
      setVersion((current) => current + 1);
    },
    [],
  );

  const remove = useCallback((jobId: string) => {
    setJobs((current) => current?.filter((item) => item.id !== jobId) ?? null);
  }, []);

  return { jobs, error, reload, add, remove };
}
