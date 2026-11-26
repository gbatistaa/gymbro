"use client";

import { ButtonLink } from "@/components/ui/button";
import { DataRow } from "@/components/ui/data-row";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { SectionLabel } from "@/components/ui/section-label";
import { Skeleton } from "@/components/ui/skeleton";
import { dashboardSchema, type Dashboard } from "@/contracts/analytics";
import {
  completionSchema,
  completionSummarySchema,
  type Completion,
  type CompletionSummary,
} from "@/contracts/completion";
import { formatCount, formatKg, formatRelative } from "@/lib/format";
import { request } from "@/lib/http";
import { useResource } from "@/lib/use-resource";
import styles from "./home.module.css";

const RECENT_LIMIT = 5;

type HomeData = {
  dashboard: Dashboard;
  summary: CompletionSummary;
  recent: Completion[];
};

async function loadHome(): Promise<HomeData> {
  const [dashboard, summary, recent] = await Promise.all([
    request({ url: "/api/dashboard", params: { weeks: 1 } }, dashboardSchema),
    request({ url: "/api/completions/summary" }, completionSummarySchema),
    request(
      { url: "/api/completions", params: { size: RECENT_LIMIT } },
      completionSchema.array(),
    ),
  ]);

  return { dashboard, summary, recent };
}

function formatWeightDelta(value: number | null | undefined): string {
  if (value == null) return "—";
  if (value === 0) return "0 kg";
  return `${value > 0 ? "+" : "-"}${formatKg(Math.abs(value))} kg`;
}

export function HomeScreen() {
  const { data, error, isLoading, reload } = useResource("home", loadHome);

  if (isLoading) {
    return (
      <div className={styles.screen}>
        <h1 className={styles.title}>Início</h1>
        <Skeleton lines={4} label="Carregando seu resumo…" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.screen}>
        <h1 className={styles.title}>Início</h1>
        <ErrorState message={error ?? "Não foi possível carregar."} onRetry={reload} />
      </div>
    );
  }

  const { dashboard, summary, recent } = data;

  if (summary.totalCount === 0) {
    return (
      <div className={styles.screen}>
        <h1 className={styles.title}>Início</h1>
        <EmptyState
          title="Nenhum treino registrado"
          description="Quando treinar, marque a rotina como feita."
          action={<ButtonLink href="/treinar">Ver rotinas</ButtonLink>}
        />
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      <h1 className={styles.title}>Início</h1>

      <section className={styles.section}>
        <SectionLabel>Treinos</SectionLabel>
        <div>
          <DataRow label="Esta semana" value={formatCount(summary.thisWeekCount)} />
          <DataRow label="Total registrado" value={formatCount(summary.totalCount)} />
          <DataRow
            label="Variação de peso"
            value={formatWeightDelta(dashboard.weightDeltaKg)}
          />
        </div>
      </section>

      <section className={styles.section}>
        <SectionLabel>Últimos treinos</SectionLabel>
        <ul className={styles.recentList}>
          {recent.map((completion) => (
            <li key={completion.id} className={styles.recentRow}>
              <span className={styles.recentName}>{completion.playlistName}</span>
              <span className={styles.recentDate}>
                {formatRelative(completion.completedAt, dashboard.timezone)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
