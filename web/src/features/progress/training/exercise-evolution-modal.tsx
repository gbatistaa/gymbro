"use client";

import { useState } from "react";
import { VariationBadge } from "@/components/charts/variation-badge";
import { ErrorState } from "@/components/ui/error-state";
import { Modal } from "@/components/ui/modal";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import type { ExerciseSeries } from "@/contracts/progress";
import { bucketForRange } from "@/lib/date-ranges";
import { formatCount, formatKg, formatVolume } from "@/lib/format";
import { useResource } from "@/lib/use-resource";
import { useUserTimeZone } from "@/lib/use-user-time-zone";
import { percentChange } from "@/lib/variation";
import { BUCKET_LABEL } from "../period-labels";
import { fetchExerciseSeries } from "../progress-api";
import styles from "../progress.module.css";
import { RangePicker, resolveRange, type RangeSelection } from "./range-picker";
import { SeriesChart } from "./series-chart";
import { SeriesHeadline } from "./series-headline";
import { SERIES_METRICS, seriesMetric, type SeriesMetricKey } from "./series-metrics";

export type EvolutionTarget = {
  exerciseId: string;
  name: string;
  primaryMuscle: string;
};

type ExerciseEvolutionModalProps = {
  exercise: EvolutionTarget;
  onClose: () => void;
};

const METRIC_OPTIONS = SERIES_METRICS.map((metric) => ({ value: metric.key, label: metric.shortLabel }));

function SummaryGrid({ summary }: { summary: ExerciseSeries["summary"] }) {
  const items = [
    { label: "Sessões", value: formatCount(summary.sessionCount) },
    { label: "Séries", value: formatCount(summary.totalSets) },
    { label: "Repetições", value: formatCount(summary.totalReps) },
    { label: "Volume", value: formatVolume(summary.totalVolume) },
    { label: "Melhor carga", value: summary.bestWeight != null ? `${formatKg(summary.bestWeight)} kg` : "—" },
    { label: "1RM estimado", value: summary.bestE1rm != null ? `${formatKg(summary.bestE1rm)} kg` : "—" },
  ];

  return (
    <dl className={styles.summaryGrid}>
      {items.map((item) => (
        <div key={item.label} className={styles.summaryItem}>
          <dt className={styles.summaryLabel}>{item.label}</dt>
          <dd className={styles.summaryValue}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Evolução de um exercício: período, métrica, número em destaque, gráfico e totais do período. */
export function ExerciseEvolutionModal({ exercise, onClose }: ExerciseEvolutionModalProps) {
  const timeZone = useUserTimeZone();
  const [selection, setSelection] = useState<RangeSelection>({ preset: "month" });
  const [metricKey, setMetricKey] = useState<SeriesMetricKey>("maxWeight");

  const range = resolveRange(selection, timeZone);
  const bucket = bucketForRange(range);
  const series = useResource(
    `progress:series:${exercise.exerciseId}:${range.from}:${range.to}:${bucket}`,
    () => fetchExerciseSeries(exercise.exerciseId, range, bucket),
  );
  const shown = series.data ?? series.lastData;
  const metric = seriesMetric(metricKey);
  const points = shown?.points ?? [];
  const variation =
    points.length > 1
      ? percentChange(metric.read(points[0]), metric.read(points[points.length - 1]))
      : null;

  return (
    <Modal title={exercise.name} description={exercise.primaryMuscle} size="large" onClose={onClose}>
      <div className={styles.evolution}>
        <RangePicker value={selection} onChange={setSelection} timeZone={timeZone} />
        <SegmentedControl legend="Métrica" options={METRIC_OPTIONS} value={metricKey} onChange={setMetricKey} size="sm" />

        {series.error ? (
          <ErrorState message={series.error} onRetry={series.reload} />
        ) : shown === null ? (
          <Skeleton lines={6} label="Carregando a evolução…" />
        ) : (
          <div className={styles.evolutionBody} aria-busy={series.isLoading || undefined}>
            <div className={styles.chartHeader}>
              <SeriesHeadline series={shown} metric={metric} timeZone={timeZone} />
              <div className={styles.chartAside}>
                <VariationBadge percentage={variation} />
                <span className={styles.chartMeta}>{metric.label} {BUCKET_LABEL[shown.bucket]}</span>
              </div>
            </div>
            <SeriesChart series={shown} metric={metric} range={range} timeZone={timeZone} height={240} />
            <SummaryGrid summary={shown.summary} />
          </div>
        )}
      </div>
    </Modal>
  );
}
