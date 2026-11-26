"use client";

import { ArrowRight, CalendarCheck2, Dumbbell, Flame, Trophy } from "lucide-react";
import { useAtomValue } from "jotai";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { SectionLabel } from "@/components/ui/section-label";
import { Skeleton } from "@/components/ui/skeleton";
import { SurfaceCard } from "@/components/ui/surface-card";
import { dashboardSchema, type Dashboard } from "@/contracts/analytics";
import {
  completionSchema,
  completionSummarySchema,
  type Completion,
  type CompletionSummary,
} from "@/contracts/completion";
import { formatCount, formatKg, formatRelative, formatVolume } from "@/lib/format";
import { request } from "@/lib/http";
import { useResource } from "@/lib/use-resource";
import { sessionAtom } from "@/stores/session";
import styles from "./home.module.css";

const RECENT_LIMIT = 5;

type HomeData = {
  dashboard: Dashboard;
  summary: CompletionSummary;
  recent: Completion[];
};

async function loadHome(): Promise<HomeData> {
  const [dashboard, summary, recent] = await Promise.all([
    request({ url: "/api/dashboard", params: { weeks: 4 } }, dashboardSchema),
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

function firstNameOf(name: string | undefined): string | null {
  const first = (name ?? "").trim().split(/\s+/)[0];
  return first || null;
}

export function HomeScreen() {
  const user = useAtomValue(sessionAtom)?.user;
  const firstName = firstNameOf(user?.name);
  const { data, error, isLoading, reload } = useResource("home", loadHome);

  if (isLoading) {
    return (
      <div className={styles.screen}>
        <header className={styles.pageHeader}>
          <span className={styles.pageKicker}>Painel diário</span>
          <h1 className={styles.title}>Início</h1>
        </header>
        <Skeleton lines={4} label="Carregando seu resumo…" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.screen}>
        <header className={styles.pageHeader}>
          <span className={styles.pageKicker}>Painel diário</span>
          <h1 className={styles.title}>Início</h1>
        </header>
        <ErrorState message={error ?? "Não foi possível carregar."} onRetry={reload} />
      </div>
    );
  }

  const { dashboard, summary, recent } = data;

  return (
    <div className={styles.screen}>
      <header className={styles.pageHeader}>
        <div className={styles.headerText}>
          <span className={styles.pageKicker}>Caderno de treino</span>
          <h1 className={styles.title}>
            {firstName ? `Olá, ${firstName}` : "Início"}
          </h1>
        </div>
        {dashboard.currentStreakWeeks > 0 ? (
          <Badge tone="primary">
            <Flame size={13} aria-hidden="true" />
            {formatCount(dashboard.currentStreakWeeks)} sem. seguidas
          </Badge>
        ) : null}
      </header>

      {dashboard.nextPlaylistId && dashboard.nextPlaylistName ? (
        <SurfaceCard className={styles.nextHero}>
          <div className={styles.nextHeroTop}>
            <div className={styles.nextHeroCopy}>
              <span className={styles.nextHeroEyebrow}>Próxima rotina sugerida</span>
              <h2 className={styles.nextHeroTitle}>{dashboard.nextPlaylistName}</h2>
            </div>
            <span className={styles.nextHeroIcon} aria-hidden="true">
              <Dumbbell size={20} />
            </span>
          </div>
          <div className={styles.nextHeroActions}>
            <ButtonLink href={`/train/playlists/${dashboard.nextPlaylistId}`} fullWidth>
              Abrir rotina e treinar
              <ArrowRight size={16} aria-hidden="true" />
            </ButtonLink>
          </div>
        </SurfaceCard>
      ) : null}

      <section className={styles.section}>
        <SectionLabel>Resumo geral</SectionLabel>
        <div className={styles.statsGrid}>
          <SurfaceCard className={styles.statCard}>
            <span className={styles.statLabel}>Esta semana</span>
            <strong className={styles.statValue}>
              {formatCount(summary.thisWeekCount)}
            </strong>
            <span className={styles.statMeta}>
              {summary.thisWeekCount === 1 ? "treino feito" : "treinos feitos"}
            </span>
          </SurfaceCard>

          <SurfaceCard className={styles.statCard}>
            <span className={styles.statLabel}>Total registrado</span>
            <strong className={styles.statValue}>
              {formatCount(summary.totalCount)}
            </strong>
            <span className={styles.statMeta}>no histórico</span>
          </SurfaceCard>

          <SurfaceCard className={styles.statCard}>
            <span className={styles.statLabel}>Sequência</span>
            <strong className={styles.statValue}>
              {formatCount(dashboard.currentStreakWeeks)}
            </strong>
            <span className={styles.statMeta}>
              {dashboard.currentStreakWeeks === 1 ? "semana ativa" : "semanas ativas"}
            </span>
          </SurfaceCard>

          <SurfaceCard className={styles.statCard}>
            <span className={styles.statLabel}>Variação corporal</span>
            <strong className={styles.statValue}>
              {formatWeightDelta(dashboard.weightDeltaKg)}
            </strong>
            <span className={styles.statMeta}>peso recente</span>
          </SurfaceCard>
        </div>
      </section>

      {dashboard.recentPrs.length > 0 ? (
        <section className={styles.section}>
          <SectionLabel>Recordes recentes (PRs)</SectionLabel>
          <SurfaceCard className={styles.listCard}>
            <ul className={styles.prList}>
              {dashboard.recentPrs.slice(0, 4).map((pr) => (
                <li key={pr.logId} className={styles.prRow}>
                  <div className={styles.prMain}>
                    <span className={styles.prIcon} aria-hidden="true">
                      <Trophy size={15} />
                    </span>
                    <div className={styles.prText}>
                      <span className={styles.prExercise}>{pr.exerciseName}</span>
                      <span className={styles.prDate}>
                        {formatRelative(pr.performedAt, dashboard.timezone)}
                      </span>
                    </div>
                  </div>
                  <div className={styles.prNumbers}>
                    <span className={styles.prLoad}>
                      {pr.weight != null ? `${formatKg(pr.weight)} kg` : "—"}
                      {pr.reps != null ? ` × ${formatCount(pr.reps)}` : ""}
                    </span>
                    <span className={styles.prE1rm}>
                      1RM est. {formatKg(pr.e1rm)} kg
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </SurfaceCard>
        </section>
      ) : null}

      <section className={styles.section}>
        <div className={styles.sectionHeaderRow}>
          <div className={styles.sectionHeaderLabel}>
            <SectionLabel>Últimos treinos</SectionLabel>
          </div>
          <Link href="/treinar" className={styles.sectionLink}>
            Ver rotinas
          </Link>
        </div>

        {recent.length === 0 ? (
          <EmptyState
            title="Nenhum treino registrado"
            description="Monte sua rotina ou marque um treino concluído para acompanhar sua evolução."
            action={<ButtonLink href="/treinar">Ir para rotinas</ButtonLink>}
          />
        ) : (
          <SurfaceCard className={styles.listCard}>
            <ul className={styles.recentList}>
              {recent.map((completion) => (
                <li key={completion.id} className={styles.recentRow}>
                  <div className={styles.recentMain}>
                    <span className={styles.recentIcon} aria-hidden="true">
                      <CalendarCheck2 size={16} />
                    </span>
                    <div className={styles.recentInfo}>
                      <Link
                        href={`/train/playlists/${completion.playlistId}`}
                        className={styles.recentName}
                      >
                        {completion.playlistName}
                      </Link>
                      <span className={styles.recentSub}>
                        {completion.loggedSets > 0
                          ? `${formatCount(completion.loggedSets)} séries · ${formatVolume(completion.totalVolume)}`
                          : "Concluído sem séries detalhadas"}
                      </span>
                    </div>
                  </div>
                  <span className={styles.recentDate}>
                    {formatRelative(completion.completedAt, dashboard.timezone)}
                  </span>
                </li>
              ))}
            </ul>
          </SurfaceCard>
        )}
      </section>
    </div>
  );
}
