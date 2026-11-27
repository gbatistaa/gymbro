import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { formatSignedPercent, variationDirection, type VariationDirection } from "@/lib/variation";
import styles from "./charts.module.css";

/**
 * `performance`: subir é bom (carga, volume), então sobe em verde e desce em vermelho.
 * `neutral`: nem sempre subir é bom (gordura, peso); a cor não julga, só a seta e o sinal mostram.
 */
export type VariationTone = "performance" | "neutral";

type VariationBadgeProps = {
  /** Variação do período, em %; `null` quando não há base de comparação. */
  percentage: number | null | undefined;
  tone?: VariationTone;
};

const ICONS = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  flat: ArrowRight,
} satisfies Record<VariationDirection, typeof ArrowRight>;

const DESCRIPTION: Record<VariationDirection, string> = {
  up: "aumento",
  down: "queda",
  flat: "sem variação",
};

/** Variação percentual do período analisado, para o canto superior direito de um gráfico. */
export function VariationBadge({ percentage, tone = "performance" }: VariationBadgeProps) {
  const direction = variationDirection(percentage);
  const Icon = ICONS[direction];
  const hasValue = percentage != null && Number.isFinite(percentage);
  const toneClass =
    !hasValue || direction === "flat"
      ? styles.variationFlat
      : tone === "neutral"
        ? styles.variationNeutral
        : direction === "up"
          ? styles.variationUp
          : styles.variationDown;

  return (
    <span className={[styles.variation, toneClass].join(" ")}>
      <Icon size={13} strokeWidth={2} aria-hidden="true" />
      <span aria-hidden="true">{formatSignedPercent(percentage)}</span>
      <span className={styles.srOnly}>
        {hasValue
          ? `Variação no período: ${DESCRIPTION[direction]} de ${formatSignedPercent(percentage)}`
          : "Variação no período indisponível"}
      </span>
    </span>
  );
}
