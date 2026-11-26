"use client";

import { useState } from "react";
import { completionSchema } from "@/contracts/completion";
import { describeApiError } from "@/lib/api-error-text";
import { request } from "@/lib/http";

export type CompleteRoutineState = {
  /** Id da ficha cuja marcação está em andamento, para o botão de cada linha. */
  pendingId: string | null;
  error: string | null;
  success: string | null;
  complete: (playlistId: string) => Promise<void>;
};

/** Marca uma ficha como feita. `onCompleted` roda depois de registrar, para recarregar contagens. */
export function useCompleteRoutine(onCompleted?: () => void): CompleteRoutineState {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function complete(playlistId: string) {
    if (pendingId) return;

    setError(null);
    setSuccess(null);
    setPendingId(playlistId);

    try {
      const completion = await request(
        { method: "POST", url: `/api/playlists/${playlistId}/completions` },
        completionSchema,
      );
      setSuccess(`Treino "${completion.playlistName}" registrado.`);
      onCompleted?.();
    } catch (failure) {
      setError(describeApiError(failure));
    } finally {
      setPendingId(null);
    }
  }

  return { pendingId, error, success, complete };
}
