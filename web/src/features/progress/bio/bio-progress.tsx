"use client";

import { useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { SegmentedControl, type SegmentedOption } from "@/components/ui/segmented-control";
import { SortableList } from "@/components/ui/sortable-list";
import { Skeleton } from "@/components/ui/skeleton";
import { METRICS, type MetricDefinition } from "@/features/bioimpedance/metrics";
import { bioPresetRange, type BioRangePreset } from "@/lib/date-ranges";
import { formatCount } from "@/lib/format";
import { applyOrder } from "@/lib/order";
import { useResource } from "@/lib/use-resource";
import { useUserTimeZone } from "@/lib/use-user-time-zone";
import { fetchBioimpedanceEvolution } from "../progress-api";
import styles from "../progress.module.css";
import { BioMetricCard } from "./bio-metric-card";
import { useMetricOrder } from "./use-metric-order";

const PRESETS: readonly SegmentedOption<BioRangePreset>[] = [
  { value: "week", label: "7 dias" },
  { value: "this-month", label: "Este mês" },
  { value: "3-months", label: "3 meses" },
  { value: "6-months", label: "6 meses" },
  { value: "year", label: "1 ano" },
];

function definitionOf(metric: string): MetricDefinition | undefined {
  return METRICS.find((definition) => definition.key === metric);
}

/** Aba Bioimpedância: uma curva suavizada por métrica, no período escolhido. */
export function BioProgress() {
  const timeZone = useUserTimeZone();
  const [preset, setPreset] = useState<BioRangePreset>("3-months");
  const range = bioPresetRange(preset, timeZone);
  const evolution = useResource(`progress:bio:${range.from}:${range.to}`, () => fetchBioimpedanceEvolution(range));
  const shown = evolution.data ?? evolution.lastData;
  const [savedOrder, saveOrder] = useMetricOrder();

  const charted = applyOrder(
    (shown?.metrics ?? []).flatMap((metric) => {
      const definition = definitionOf(metric.metric);
      return definition && metric.points.length > 0 ? [{ metric, definition }] : [];
    }),
    (entry) => entry.metric.metric,
    savedOrder,
  );

  return (
    <div className={styles.tabPanel}>
      <SegmentedControl legend="Período" options={PRESETS} value={preset} onChange={setPreset} size="sm" />

      {evolution.error ? (
        <ErrorState message={evolution.error} onRetry={evolution.reload} />
      ) : shown === null ? (
        <Skeleton lines={6} label="Carregando a evolução corporal…" />
      ) : shown.measurementCount === 0 ? (
        <EmptyState
          title="Nenhuma medição nesse período"
          description="Escolha um período maior ou registre uma bioimpedância."
          action={<ButtonLink href="/bioimpedance">Registrar medição</ButtonLink>}
        />
      ) : (
        <>
          <section className={styles.section} aria-labelledby="bio-metrics-title" aria-busy={evolution.isLoading || undefined}>
            <div className={styles.sectionHeader}>
              <h2 id="bio-metrics-title" className={styles.sectionTitle}>Métricas corporais</h2>
              <span className={styles.sectionCount} aria-live="polite">
                {formatCount(shown.measurementCount)} {shown.measurementCount === 1 ? "medição" : "medições"}
              </span>
            </div>
            <SortableList
              items={charted}
              getId={(entry) => entry.metric.metric}
              getLabel={(entry) => `gráfico de ${entry.definition.label}`}
              onReorder={(next) => saveOrder(next.map((entry) => entry.metric.metric))}
              renderItem={({ metric, definition }, dragHandle) => (
                <BioMetricCard
                  evolution={metric}
                  definition={definition}
                  range={range}
                  timeZone={timeZone}
                  dragHandle={dragHandle}
                />
              )}
            />
          </section>
        </>
      )}
    </div>
  );
}
