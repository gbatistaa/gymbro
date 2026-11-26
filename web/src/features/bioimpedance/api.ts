import { z } from "zod";
import {
  bioimpedanceSchema,
  importJobSchema,
  type Bioimpedance,
  type BioimpedancePayload,
  type ImportJob,
} from "@/contracts/bioimpedance";
import { request, requestMaybe } from "@/lib/http";

const MEASUREMENTS_URL = "/api/bioimpedance";
const IMPORTS_URL = "/api/bioimpedance/imports";

/** Medições do usuário, da mais recente para a mais antiga. */
export async function listMeasurements(): Promise<Bioimpedance[]> {
  const measurements = await request({ url: MEASUREMENTS_URL }, bioimpedanceSchema.array());
  return [...measurements].sort(
    (left, right) => Date.parse(right.measuredAt) - Date.parse(left.measuredAt),
  );
}

export function createMeasurement(payload: BioimpedancePayload): Promise<Bioimpedance> {
  return request({ method: "POST", url: MEASUREMENTS_URL, data: payload }, bioimpedanceSchema);
}

export async function deleteMeasurement(id: string): Promise<void> {
  await requestMaybe({ method: "DELETE", url: `${MEASUREMENTS_URL}/${id}` }, z.unknown());
}

/** Importações em aberto: na fila, lendo, prontas para revisar ou com falha. */
export function listOpenImports(): Promise<ImportJob[]> {
  return request({ url: IMPORTS_URL }, importJobSchema.array());
}

/** Envia o PDF; `onProgress` recebe a fração enviada, de 0 a 1. */
export function uploadReport(file: File, onProgress: (fraction: number) => void): Promise<ImportJob> {
  const body = new FormData();
  body.append("file", file);

  return request(
    {
      method: "POST",
      url: IMPORTS_URL,
      data: body,
      onUploadProgress: (event) => {
        if (event.total) onProgress(event.loaded / event.total);
      },
    },
    importJobSchema,
  );
}

export function confirmImport(jobId: string, payload: BioimpedancePayload): Promise<Bioimpedance> {
  return request(
    { method: "POST", url: `${IMPORTS_URL}/${jobId}/confirm`, data: payload },
    bioimpedanceSchema,
  );
}

export async function discardImport(jobId: string): Promise<void> {
  await requestMaybe({ method: "DELETE", url: `${IMPORTS_URL}/${jobId}` }, z.unknown());
}
