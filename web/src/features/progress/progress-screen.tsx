"use client";

import { Activity, BarChart3, Flame, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { SectionLabel } from "@/components/ui/section-label";
import { Skeleton } from "@/components/ui/skeleton";
import { SurfaceCard } from "@/components/ui/surface-card";
import {
  dashboardSchema,
  muscleVolumeSchema,
  type Dashboard,
  type MuscleVolume,
} from "@/contracts/analytics";
import { formatCount, formatDate, formatKg, formatRelative, formatVolume } from "@/lib/format";
import { request } from "@/lib/http";
import { useResource } from "@/lib/use-resource";
import styles from "./progress.module.css";

type ProgressData = {
  dashboard: Dashboard;
  muscles: MuscleVolume[];
};

async function loadProgress(): Promise<ProgressData> {
  const [dashboard, muscles] = await Promise.all([
    request({ url: "/api/dashboard", params: { weeks: 8 } }, dashboardSchema),
    request({ url: "/api/dashboard/muscle-volume" }, muscleVolumeSchema.array()),
  ]);

  return { dashboard, muscles };
}

export function ProgressScreen() {
  const { data, error, isLoading, reload } = useResource("progress", loadProgress);

  if (isLoading) {
    return (
      <div className={styles.screen}>
        <header className={styles.pageHeader}>
          <span className={styles.pageKicker}>Análise de treino</span>
          <h1 className={styles.title}>Progresso</h1>
        </header>
        <Skeleton lines={4} label="Carregando seu progresso…" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.screen}>
        <header className={styles.pageHeader}>
          <span className={styles.pageKicker}>Análise de treino</span>
          <h1 className={styles.title}>Progresso</h1>
        </header>
        <ErrorState
          message={error ?? "Não foi possível carregar suas métricas."}
          onRetry={reload}
        />
      </div>
    );
  }

  const { dashboard, muscles } = data;
  const totalSessions = dashboard.weeks.reduce((sum, w) => sum + w.sessions, 0);
  const totalVolume = dashboard.weeks.reduce((sum, w) => sum + w.volume, 0);
  const maxWeekSessions = Math.max(1, ...dashboard.weeks.map((w) => w.sessions));
  const maxMuscleSets = Math.max(1, ...muscles.map((m) => m.sets));

  return (
    <div className={styles.screen}>
      <header className={styles.pageHeader}>
        <div className={styles.headerText}>
          <span className={styles.pageKicker}>Análise de treino</span>
          <h1 className={styles.title}>Progresso</h1>
        </div>
        {dashboard.currentStreakWeeks > 0 ? (
          <Badge tone="primary">
            <Flame size={13} aria-hidden="true" />
            {formatCount(dashboard.currentStreakWeeks)} sem. ativas
          </Badge>
        ) : null}
      </header>

      <section className={styles.section}>
        <SectionLabel>Últimas 8 semanas</SectionLabel>
        <div className={styles.summaryGrid}>
          <SurfaceCard className={styles.metricCard}>
            <span className={styles.metricLabel}>Sessões</span>
            <strong className={styles.metricValue}>{formatCount(totalSessions)}</strong>
            <span className={styles.metricSub}>treinos concluídos</span>
          </SurfaceCard>

          <SurfaceCard className={styles.metricCard}>
            <span className={styles.metricLabel}>Volume acumulado</span>
            <strong className={styles.metricValue}>{formatVolume(totalVolume)}</strong>
            <span className={styles.metricSub}>carga × repetições</span>
          </SurfaceCard>
        </div>
      </section>

      {dashboard.weeks.length > 0 ? (
        <section className={styles.section}>
          <SectionLabel>Frequência semanal</SectionLabel>
          <SurfaceCard className={styles.weeksCard}>
            <ul className={styles.weeksList}>
              {dashboard.weeks.map((week) => {
                const ratio = Math.min(100, Math.round((week.sessions / maxWeekSessions) * 100));

                return (
                  <li key={week.weekStart} className={styles.weekRow}>
                    <div className={styles.weekTop}>
                      <span className={styles.weekDate}>
                        Sem. {formatDate(week.weekStart, dashboard.timezone)}
                      </span>
                      <span className={styles.weekStats}>
                        <strong>{formatCount(week.sessions)}</strong>{" "}
                        {week.sessions === 1 ? "treino" : "treinos"}
                        {week.volume > 0 ? ` · ${formatVolume(week.volume)}` : ""}
                      </span>
                    </div>
                    <div className={styles.progressTrack} aria-hidden="true">
                      <div
                        className={styles.progressFill}
                        style={{ width: `${week.sessions > 0 ? Math.max(8, ratio) : 0}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </SurfaceCard>
        </section>
      ) : null}

      <section className={styles.section}>
        <SectionLabel>Volume por grupo muscular</SectionLabel>
        {muscles.length === 0 ? (
          <SurfaceCard className={styles.emptyCard}>
            <BarChart3 size={20} className={styles.emptyCardIcon} aria-hidden="true" />
            <p className={styles.emptyCardText}>
              Registre séries com carga nos seus treinos para visualizar a distribuição por músculo.
            </p>
          </SurfaceCard>
        ) : (
          <SurfaceCard className={styles.weeksCard}>
            <ul className={styles.weeksList}>
              {muscles.map((item) => {
                const ratio = Math.min(100, Math.round((item.sets / maxMuscleSets) * 100));

                return (
                  <li key={item.muscle} className={styles.weekRow}>
                    <div className={styles.weekTop}>
                      <span className={styles.muscleName}>{item.muscle}</span>
                      <span className={styles.weekStats}>
                        <strong>{formatCount(item.sets)}</strong>{" "}
                        {item.sets === 1 ? "série" : "séries"} · {formatVolume(item.volume)}
                      </span>
                    </div>
                    <div className={styles.progressTrack} aria-hidden="true">
                      <div
                        className={styles.progressFillInfo}
                        style={{ width: `${Math.max(10, ratio)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </SurfaceCard>
        )}
      </section>

      <section className={styles.section}>
        <SectionLabel>Recordes pessoais (PRs)</SectionLabel>
        {dashboard.recentPrs.length === 0 ? (
          <EmptyState
            title="Sem recordes registrados ainda"
            description="Complete seus treinos registrando cargas e repetições para calcular seu 1RM estimado."
            action={<ButtonLink href="/treinar">Ver rotinas</ButtonLink>}
          />
        ) : (
          <SurfaceCard className={styles.prListCard}>
            <ul className={styles.prList}>
              {dashboard.recentPrs.map((pr) => (
                <li key={pr.logId} className={styles.prRow}>
                  <div className={styles.prLeft}>
                    <span className={styles.prBadgeIcon} aria-hidden="true">
                      <Trophy size={15} />
                    </span>
                    <div className={styles.prMeta}>
                      <span className={styles.prExercise}>{pr.exerciseName}</span>
                      <span className={styles.prTime}>
                        {formatRelative(pr.performedAt, dashboard.timezone)}
                      </span>
                    </div>
                  </div>
                  <div className={styles.prRight}>
                    <span className={styles.prWeight}>
                      {pr.weight != null ? `${formatKg(pr.weight)} kg` : "—"}
                      {pr.reps != null ? ` × ${formatCount(pr.reps)}` : ""}
                    </span>
                    <span className={styles.prE1rm}>
                      <Activity size={11} aria-hidden="true" />
                      1RM {formatKg(pr.e1rm)} kg
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </SurfaceCard>
        )}
      </section>
    </div>
  );
}
