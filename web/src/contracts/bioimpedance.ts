import { z } from "zod";
import { zonedInputToIso } from "@/lib/zoned-time";
import { isoDateTime } from "./primitives";

export const actionTypeSchema = z.enum(["INSERT", "UPDATE", "DELETE"]);

export const importJobStatusSchema = z.enum([
  "PENDING",
  "PROCESSING",
  "DONE",
  "FAILED",
]);

export const importStatusSchema = z.enum(["CREATED", "DUPLICATE", "ERROR"]);

/** `MANUAL` para entrada pelo formulário; qualquer outro valor veio de importação. */
export const MANUAL_SOURCE = "MANUAL";

export const bioimpedanceSchema = z.object({
  id: z.uuid(),
  measuredAt: isoDateTime,
  bodyWeightKg: z.number().nullish(),
  heightCm: z.number().nullish(),
  bodyFatPercentage: z.number(),
  muscleMassKg: z.number(),
  skeletalMuscleMassKg: z.number().nullish(),
  visceralFat: z.number().nullish(),
  waterPercentage: z.number().nullish(),
  source: z.string(),
  sourceFileHash: z.string().nullish(),
  sourceFileName: z.string().nullish(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime.nullish(),
});

/** Auditoria de uma medição: o payload antigo/novo é JSON livre vindo do backend. */
export const bioimpedanceLogSchema = z.object({
  id: z.uuid(),
  actionType: actionTypeSchema,
  oldData: z.unknown().nullish(),
  newData: z.unknown().nullish(),
  createdAt: isoDateTime,
});

/**
 * Importação de um laudo em PDF. `result` é o JSON livre devolvido pelo motor de extração; leia-o
 * com `bioimpedanceExtractionSchema`. `bioimpedanceId` só existe depois da confirmação.
 */
export const importJobSchema = z.object({
  id: z.uuid(),
  status: importJobStatusSchema,
  sourceFileName: z.string(),
  sourceFileHash: z.string(),
  result: z.unknown().nullish(),
  error: z.string().nullish(),
  createdAt: isoDateTime,
  finishedAt: isoDateTime.nullish(),
  bioimpedanceId: z.uuid().nullish(),
});

export const importResponseSchema = z.object({
  results: z.array(
    z.object({
      index: z.number().int(),
      status: importStatusSchema,
      id: z.uuid().nullish(),
      message: z.string().nullish(),
    }),
  ),
  created: z.number().int(),
  duplicates: z.number().int(),
  errors: z.number().int(),
});

/** Mesmo limite do backend (`spring.servlet.multipart.max-file-size`). */
export const MAX_REPORT_BYTES = 10 * 1024 * 1024;

/** Laudo escolhido para importação. Alguns celulares não informam o tipo; a extensão basta. */
export const reportFileSchema = z
  .file("Escolha um arquivo PDF.")
  .refine(
    (file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"),
    "Escolha um arquivo PDF.",
  )
  .refine((file) => file.size > 0, "O arquivo está vazio. Escolha outro PDF.")
  .refine((file) => file.size <= MAX_REPORT_BYTES, "O PDF pode ter no máximo 10 MB.");

const NUMBER_IN_TEXT = /-?\d+(?:[.,]\d+)?/;

/** O motor normaliza para número, mas jobs antigos podem trazer texto como `"82,4 kg"`. */
const extractedNumber = z
  .union([z.number(), z.string(), z.null()])
  .optional()
  .transform((value): number | null => {
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value !== "string") return null;
    const match = NUMBER_IN_TEXT.exec(value);
    return match ? Number(match[0].replace(",", ".")) : null;
  })
  .catch(null);

/**
 * Valores lidos do laudo. `measuredAt` vem como impresso no documento: `YYYY-MM-DD`, data e hora
 * sem fuso ou, em jobs antigos, um instante com fuso.
 */
export const bioimpedanceExtractionSchema = z.object({
  measuredAt: z
    .string()
    .nullish()
    .transform((value) => value ?? null)
    .catch(null),
  bodyWeightKg: extractedNumber,
  heightCm: extractedNumber,
  bodyFatPercentage: extractedNumber,
  muscleMassKg: extractedNumber,
  skeletalMuscleMassKg: extractedNumber,
  visceralFat: extractedNumber,
  waterPercentage: extractedNumber,
});

type Range = {
  min: number;
  max?: number;
  /** `true` quando o mínimo não é aceito (valor precisa ser positivo). */
  exclusiveMin?: boolean;
};

const DECIMAL_TEXT = /^\d+(?:[.,]\d+)?$/;

function rangeText({ min, max, exclusiveMin }: Range, unit: string): string {
  if (max === undefined) return exclusiveMin ? `maior que ${min}${unit}` : `a partir de ${min}${unit}`;
  return `de ${min} a ${max}${unit}`;
}

/** Campo numérico do formulário: texto com vírgula ou ponto → número, ou `null` se opcional e vazio. */
function measurementField(label: string, range: Range, unit: string, required: boolean) {
  return z.string().transform((raw, ctx): number | null => {
    const text = raw.trim();

    if (text === "") {
      if (!required) return null;
      ctx.issues.push({ code: "custom", input: raw, message: `Informe ${label}.` });
      return z.NEVER;
    }

    if (!DECIMAL_TEXT.test(text)) {
      ctx.issues.push({
        code: "custom",
        input: raw,
        message: `${capitalize(label)}: digite só o número, ex.: 18,5.`,
      });
      return z.NEVER;
    }

    const value = Number(text.replace(",", "."));
    const belowMin = range.exclusiveMin ? value <= range.min : value < range.min;
    const aboveMax = range.max !== undefined && value > range.max;

    if (belowMin || aboveMax) {
      ctx.issues.push({
        code: "custom",
        input: raw,
        message: `${capitalize(label)}: use um valor ${rangeText(range, unit)}.`,
      });
      return z.NEVER;
    }

    return value;
  });
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Formulário de medição (entrada manual e revisão da importação). Os limites espelham o backend.
 * `measuredAt` chega como `YYYY-MM-DDTHH:mm` no fuso do perfil e sai como instante UTC.
 */
export function createBioimpedanceFormSchema(timeZone: string) {
  return z.object({
    measuredAt: z.string().transform((raw, ctx): string => {
      if (raw.trim() === "") {
        ctx.issues.push({ code: "custom", input: raw, message: "Informe a data e a hora da medição." });
        return z.NEVER;
      }

      const iso = zonedInputToIso(raw, timeZone);
      if (iso === null) {
        ctx.issues.push({ code: "custom", input: raw, message: "Data da medição inválida. Confira dia, mês e hora." });
        return z.NEVER;
      }
      if (new Date(iso).getTime() > Date.now()) {
        ctx.issues.push({ code: "custom", input: raw, message: "A data da medição não pode estar no futuro." });
        return z.NEVER;
      }

      return iso;
    }),
    bodyWeightKg: measurementField("o peso", { min: 20, max: 400 }, " kg", false),
    heightCm: measurementField("a altura", { min: 100, max: 250 }, " cm", false),
    bodyFatPercentage: measurementField("a gordura corporal", { min: 0, max: 70 }, "%", true),
    muscleMassKg: measurementField("a massa muscular", { min: 0, exclusiveMin: true }, " kg", true),
    skeletalMuscleMassKg: measurementField(
      "a massa muscular esquelética",
      { min: 0, exclusiveMin: true },
      " kg",
      false,
    ),
    visceralFat: measurementField("a gordura visceral", { min: 0, max: 60 }, "", false),
    waterPercentage: measurementField("a água corporal", { min: 0, max: 100 }, "%", false),
  });
}

export type ActionType = z.infer<typeof actionTypeSchema>;
export type ImportJobStatus = z.infer<typeof importJobStatusSchema>;
export type ImportStatus = z.infer<typeof importStatusSchema>;
export type Bioimpedance = z.infer<typeof bioimpedanceSchema>;
export type BioimpedanceLog = z.infer<typeof bioimpedanceLogSchema>;
export type ImportJob = z.infer<typeof importJobSchema>;
export type ImportResponse = z.infer<typeof importResponseSchema>;
export type BioimpedanceExtraction = z.infer<typeof bioimpedanceExtractionSchema>;
export type BioimpedanceFormSchema = ReturnType<typeof createBioimpedanceFormSchema>;
/** Valores digitados, campo a campo, como texto. */
export type BioimpedanceFormInput = z.input<BioimpedanceFormSchema>;
/** Corpo de `POST /api/bioimpedance` e de `POST /api/bioimpedance/imports/{id}/confirm`. */
export type BioimpedancePayload = z.output<BioimpedanceFormSchema>;
export type MeasurementFieldName = keyof BioimpedanceFormInput;
