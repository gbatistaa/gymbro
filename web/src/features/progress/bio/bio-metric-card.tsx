import type { ReactNode } from "react";
import { LineChart } from "@/components/charts/line-chart";
import { VariationBadge } from "@/components/charts/variation-badge";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { MetricEvolution } from "@/contracts/progress";
import { formatMetric, formatDelta, type MetricDefinition } from "@/features/bioimpedance/metrics";
import type { TimeRange } from "@/lib/date-ranges";
import { formatDate, formatKg } from "@/lib/format";
import { formatAxisDate } from "../period-labels";
import styles from "../progress.module.css";

type BioMetricCardProps = {
  evolution: MetricEvolution;
  definition: MetricDefinition;
  range: TimeRange;
  timeZone: string;
  /** Alça de arrastar para reordenar; vem da lista e some quando há um gráfico só. */
  dragHandle: ReactNode;
};

/** Uma métrica de bioimpedância: valor atual, variação no período, faixa e a curva. */
export function BioMetricCard({ evolution, definition, range, timeZone, dragHandle }: BioMetricCardProps) {
  const data = evolution.points.map((point) => ({ x: Date.parse(point.measuredAt), y: point.value }));
  const hasRange = evolution.min != null && evolution.max != null && evolution.min !== evolution.max;
  const delta = evolution.deltaAbsolute;
  const change =
    delta == null
      ? "1 medição no período"
      : Math.round(delta * 10) === 0
        ? "Sem variação no período"
        : `${formatDelta(definition.unit, delta)} no período`;

  return (
    <SurfaceCard as="article" className={styles.bioCard}>
      <header className={styles.cardHeader}>
        {dragHandle}
        <h3 className={styles.bioCardTitle}>{definition.label}</h3>
        <VariationBadge percentage={evolution.deltaPercentage} tone="neutral" />
      </header>
      <div className={styles.bioCardBody}>
        <strong className={styles.bioCardValue}>{formatMetric(definition.unit, evolution.last)}</strong>
        <span className={styles.bioCardChange}>
          {change}
          {hasRange
            ? ` · entre ${formatMetric(definition.unit, evolution.min)} e ${formatMetric(definition.unit, evolution.max)}`
            : ""}
        </span>
      </div>
      <LineChart
        data={data}
        label={definition.label}
        xDomain={[Date.parse(range.from), Date.parse(range.to) - 1]}
        formatValue={(value) => formatMetric(definition.unit, value)}
        formatTick={formatKg}
        formatDate={(x) => formatDate(new Date(x).toISOString(), timeZone)}
        formatAxisDate={(x) => formatAxisDate(x, timeZone)}
        height={190}
      />
    </SurfaceCard>
  );
}
