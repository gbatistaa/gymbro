import { z } from "zod";

/**
 * Data e hora no contrato da API. O backend serializa `Instant` em UTC com offset; qualquer
 * variação (por exemplo, sem fuso) é erro de contrato, não valor aceitável.
 */
export const isoDateTime = z.iso.datetime({ offset: true });
