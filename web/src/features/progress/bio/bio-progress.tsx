"use client";

import { useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { SegmentedControl, type SegmentedOption } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { METRICS, type MetricDefinition } from "@/features/bioimpedance/metrics";
import { bioPresetRange, type BioRangePreset } from "@/lib/date-ranges";
import { formatCount } from "@/lib/format";
import { useResource } from "@/lib/use-resource";
import { useUserTimeZone } from "@/lib/use-user-time-zone";
import { fetchBioimpedanceEvolution } from "../progress-api";
import styles from "../progress.module.css";
import { BioMetricCard } from "./bio-metric-card";

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

  const charted = (shown?.metrics ?? []).flatMap((metric) => {
    const definition = definitionOf(metric.metric);
    return definition && metric.points.length > 0 ? [{ metric, definition }] : [];
  });

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
          <p className={styles.bioSummary} aria-live="polite">
            {formatCount(shown.measurementCount)} {shown.measurementCount === 1 ? "medição" : "medições"} no período
          </p>
          <div className={styles.bioGrid} aria-busy={evolution.isLoading || undefined}>
            {charted.map(({ metric, definition }) => (
              <BioMetricCard
                key={metric.metric}
                evolution={metric}
                definition={definition}
                range={range}
                timeZone={timeZone}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
