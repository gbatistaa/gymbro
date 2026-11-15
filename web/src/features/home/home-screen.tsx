"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { DataRow } from "@/components/ui/data-row";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Notice } from "@/components/ui/notice";
import { SectionLabel } from "@/components/ui/section-label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  dashboardSchema,
  nextTargetSchema,
  type Dashboard,
  type NextTarget,
} from "@/contracts/analytics";
import {
  playlistDetailSchema,
  type PlaylistDetail,
} from "@/contracts/playlist";
import { sessionSchema, type Session } from "@/contracts/session";
import { describeApiError } from "@/lib/api-error-text";
import {
  formatCount,
  formatDuration,
  formatKg,
  formatRelative,
  formatVolume,
} from "@/lib/format";
import { request, requestMaybe } from "@/lib/http";
import { useResource } from "@/lib/use-resource";
import { WeeklyBars } from "./weekly-bars";
import styles from "./home.module.css";

type HomeData = {
  dashboard: Dashboard;
  active: Session | null;
  nextTargets: NextTarget[];
  activePlaylist: PlaylistDetail | null;
};

async function loadHome(): Promise<HomeData> {
  const [dashboard, active] = await Promise.all([
    request({ url: "/api/dashboard", params: { weeks: 12 } }, dashboardSchema),
    requestMaybe({ url: "/api/sessions/active" }, sessionSchema),
  ]);

  const [nextTargets, activePlaylist] = await Promise.all([
    dashboard.nextPlaylistId
      ? request(
          { url: `/api/playlists/${dashboard.nextPlaylistId}/next-targets` },
          nextTargetSchema.array(),
        )
      : Promise.resolve<NextTarget[]>([]),
    active?.playlistId
      ? request(
          { url: `/api/playlists/${active.playlistId}` },
          playlistDetailSchema,
        )
      : Promise.resolve<PlaylistDetail | null>(null),
  ]);

  return { dashboard, active, nextTargets, activePlaylist };
}

function formatWeightDelta(value: number | null | undefined): string {
  if (value == null) return "—";
  if (value === 0) return "0 kg";
  return `${value > 0 ? "+" : "-"}${formatKg(Math.abs(value))} kg`;
}

function formatPrAmount(
  weight: number | null | undefined,
  reps: number | null | undefined,
): string {
  const parts = [
    weight == null ? null : `${formatKg(weight)} kg`,
    reps == null ? null : `× ${formatCount(reps)}`,
  ].filter(Boolean);

  return parts.join(" ") || "—";
}

/** Sem histórico não há carga: mostra só a meta de repetições. */
function formatTarget(target: NextTarget): string {
  const weight = target.suggestedWeight ?? target.lastWeight;
  const reps = target.suggestedReps ?? target.targetRepsMax;

  if (weight == null) {
    return reps == null
      ? target.exerciseName
      : `${target.exerciseName} · ${formatCount(reps)} reps`;
  }

  return `${target.exerciseName} · ${formatPrAmount(weight, reps)}`;
}

function ElapsedTime({ startedAt }: { startedAt: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const seconds = Math.max(
    0,
    Math.floor((now - new Date(startedAt).getTime()) / 1000),
  );

  return <span className={styles.activeElapsed}>{formatDuration(seconds)}</span>;
}

export function HomeScreen() {
  const router = useRouter();
  const { data, error, isLoading, reload } = useResource("home", loadHome);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className={styles.screen}>
        <h1 className={styles.title}>Início</h1>
        <Skeleton lines={6} label="Carregando seu resumo…" />
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

  const { dashboard, active, nextTargets, activePlaylist } = data;
  const currentWeek = dashboard.weeks.at(-1);
  const hasTraining = dashboard.weeks.some((week) => week.sessions > 0);
  const nextTarget = nextTargets[0];
  const isNewAccount =
    !active && !dashboard.nextPlaylistId && !hasTraining;

  async function startSession() {
    if (!dashboard.nextPlaylistId || isStarting) return;

    setStartError(null);
    setIsStarting(true);

    try {
      const session = await request(
        {
          method: "POST",
          url: "/api/sessions",
          data: { playlistId: dashboard.nextPlaylistId },
        },
        sessionSchema,
      );
      router.push(`/train/sessions/${session.id}`);
    } catch (failure) {
      if (axios.isAxiosError(failure) && failure.response?.status === 409) {
        setStartError("Você já tem uma sessão em andamento.");
        reload();
      } else {
        setStartError(describeApiError(failure));
      }
    } finally {
      setIsStarting(false);
    }
  }

  if (isNewAccount) {
    return (
      <div className={styles.screen}>
        <h1 className={styles.title}>Início</h1>
        <EmptyState
          title="Nenhum treino registrado"
          description="Crie uma rotina para começar a registrar suas séries."
          action={<ButtonLink href="/train">Criar rotina</ButtonLink>}
        />
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      <h1 className={styles.title}>Início</h1>

      {startError ? <Notice tone="error">{startError}</Notice> : null}

      {active ? (
        <section className={styles.active} aria-labelledby="home-active">
          <h2 id="home-active" className={styles.activeLabel}>
            Sessão em andamento
          </h2>
          <div className={styles.activeTop}>
            <p className={styles.activeName}>
              {activePlaylist?.name ?? "Sessão livre"}
            </p>
            <ElapsedTime startedAt={active.startedAt} />
          </div>
          <DataRow
            label="Volume parcial"
            value={formatVolume(active.totalVolume ?? 0)}
          />
          <ButtonLink href={`/train/sessions/${active.id}`} fullWidth>
            Continuar
          </ButtonLink>
        </section>
      ) : dashboard.nextPlaylistId ? (
        <section className={styles.section}>
          <SectionLabel>Próximo treino</SectionLabel>
          <p className={styles.nextName}>{dashboard.nextPlaylistName}</p>
          {nextTarget ? (
            <p className={styles.nextTarget}>{formatTarget(nextTarget)}</p>
          ) : (
            <p className={styles.muted}>Rotina sem exercícios.</p>
          )}
          {nextTarget ? (
            <Button onClick={startSession} isLoading={isStarting} fullWidth>
              Iniciar
            </Button>
          ) : (
            <ButtonLink href="/train" variant="secondary" fullWidth>
              Ver rotina
            </ButtonLink>
          )}
        </section>
      ) : (
        <section className={styles.section}>
          <SectionLabel>Próximo treino</SectionLabel>
          <EmptyState
            title="Nenhuma rotina ativa"
            description="Crie uma rotina para o próximo treino."
            action={<ButtonLink href="/train">Criar rotina</ButtonLink>}
          />
        </section>
      )}

      <section className={styles.section}>
        <SectionLabel>Números da semana</SectionLabel>
        <div>
          <DataRow label="Sessões" value={formatCount(currentWeek?.sessions ?? 0)} />
          <DataRow label="Volume" value={formatVolume(currentWeek?.volume ?? 0)} />
          <DataRow
            label="Sequência"
            value={`${formatCount(dashboard.currentStreakWeeks)} sem`}
          />
          <DataRow
            label="Variação de peso"
            value={formatWeightDelta(dashboard.weightDeltaKg)}
          />
        </div>
      </section>

      <section className={styles.section}>
        <SectionLabel>Volume · 12 semanas</SectionLabel>
        {hasTraining ? (
          <WeeklyBars weeks={dashboard.weeks} timezone={dashboard.timezone} />
        ) : (
          <p className={styles.muted}>
            Sem treinos registrados nas últimas 12 semanas.
          </p>
        )}
      </section>

      <section className={styles.section}>
        <SectionLabel>PRs recentes</SectionLabel>
        {dashboard.recentPrs.length === 0 ? (
          <p className={styles.muted}>Nenhum PR no período.</p>
        ) : (
          <ul className={styles.prList}>
            {dashboard.recentPrs.map((pr) => (
              <li key={pr.logId} className={styles.prRow}>
                <span className={styles.prName}>{pr.exerciseName}</span>
                <span className={styles.prValue}>
                  {formatPrAmount(pr.weight, pr.reps)}
                </span>
                <span className={styles.prDate}>
                  {formatRelative(pr.performedAt, dashboard.timezone)}
                </span>
                <span className={styles.prE1rm}>
                  e1RM {formatKg(pr.e1rm)} kg
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
