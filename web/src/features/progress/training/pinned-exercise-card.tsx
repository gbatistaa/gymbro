"use client";

import { ChevronRight } from "lucide-react";
import { useState, type ReactNode } from "react";
import { VariationBadge } from "@/components/charts/variation-badge";
import { ErrorState } from "@/components/ui/error-state";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { PinnedExercise } from "@/contracts/progress";
import type { SeriesBucket, TimeRange } from "@/lib/date-ranges";
import { useResource } from "@/lib/use-resource";
import { percentChange } from "@/lib/variation";
import { fetchExerciseSeries } from "../progress-api";
import styles from "../progress.module.css";
import { SeriesChart } from "./series-chart";
import { SeriesHeadline } from "./series-headline";
import { PINNED_METRIC_KEYS, seriesMetric, type SeriesMetricKey } from "./series-metrics";

type PinnedExerciseCardProps = {
  exercise: PinnedExercise;
  range: TimeRange;
  bucket: SeriesBucket;
  timeZone: string;
  onOpen: () => void;
  /** Alça de arrastar para reordenar; vem da lista e some quando há um exercício só. */
  dragHandle: ReactNode;
};

const METRIC_OPTIONS = PINNED_METRIC_KEYS.map((key) => ({ value: key, label: seriesMetric(key).shortLabel }));

/** Gráfico de um exercício fixado, com a métrica escolhida no próprio cartão. */
export function PinnedExerciseCard({
  exercise,
  range,
  bucket,
  timeZone,
  onOpen,
  dragHandle,
}: PinnedExerciseCardProps) {
  const [metricKey, setMetricKey] = useState<SeriesMetricKey>("maxWeight");
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
    <SurfaceCard as="article" className={styles.pinnedCard}>
      <header className={styles.cardHeader}>
        {dragHandle}
        <button type="button" className={styles.cardTitle} onClick={onOpen}>
          <span className={styles.cardName}>
            <span className={styles.cardNameText}>{exercise.name}</span>
            <ChevronRight size={14} strokeWidth={1.75} className={styles.cardChevron} aria-hidden="true" />
          </span>
          <span className={styles.cardSub}>{exercise.primaryMuscle}</span>
          <span className={styles.srOnly}>Ver evolução completa</span>
        </button>
        <VariationBadge percentage={variation} />
      </header>

      <SegmentedControl
        legend={`Métrica de ${exercise.name}`}
        options={METRIC_OPTIONS}
        value={metricKey}
        onChange={setMetricKey}
        size="sm"
      />

      {series.error ? (
        <ErrorState message={series.error} onRetry={series.reload} />
      ) : shown === null ? (
        <Skeleton lines={4} label={`Carregando ${exercise.name}…`} />
      ) : (
        <div className={styles.pinnedBody} aria-busy={series.isLoading || undefined}>
          <SeriesHeadline series={shown} metric={metric} timeZone={timeZone} />
          <SeriesChart series={shown} metric={metric} range={range} timeZone={timeZone} height={170} />
        </div>
      )}
    </SurfaceCard>
  );
}
