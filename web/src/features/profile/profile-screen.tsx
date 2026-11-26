"use client";

import {
  AtSign,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  Dumbbell,
  Globe,
  LogOut,
  Mail,
  Pencil,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useSetAtom } from "jotai";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { SectionLabel } from "@/components/ui/section-label";
import { Skeleton } from "@/components/ui/skeleton";
import { userSummarySchema, type UserSummary } from "@/contracts/auth";
import { completionSummarySchema, type CompletionSummary } from "@/contracts/completion";
import { playlistSummarySchema } from "@/contracts/playlist";
import { logout } from "@/features/auth/api";
import { formatCount, formatDate } from "@/lib/format";
import { request } from "@/lib/http";
import { notifySuccess } from "@/lib/notify";
import { timeZoneLabel } from "@/lib/timezones";
import { useResource } from "@/lib/use-resource";
import { sessionAtom } from "@/stores/session";
import { EditProfileDialog } from "./edit-profile-dialog";
import styles from "./profile.module.css";

type ProfileData = {
  user: UserSummary;
  summary: CompletionSummary;
  planCount: number;
};

async function loadProfile(): Promise<ProfileData> {
  const [user, summary, plans] = await Promise.all([
    request({ url: "/api/users/me" }, userSummarySchema),
    request({ url: "/api/completions/summary" }, completionSummarySchema),
    request({ url: "/api/playlists" }, playlistSummarySchema.array()),
  ]);

  return { user, summary, planCount: plans.length };
}

function initialsOf(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "?";
}

type StatTileProps = {
  icon: LucideIcon;
  value: number;
  label: string;
};

function StatTile({ icon: Icon, value, label }: StatTileProps) {
  return (
    <div className={styles.stat}>
      <span className={styles.statIcon} aria-hidden="true">
        <Icon size={18} strokeWidth={1.75} />
      </span>
      <span className={styles.statValue}>{formatCount(value)}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}

type DetailRowProps = {
  icon: LucideIcon;
  label: string;
  value: string;
};

function DetailRow({ icon: Icon, label, value }: DetailRowProps) {
  return (
    <li className={styles.detailRow}>
      <span className={styles.detailIcon} aria-hidden="true">
        <Icon size={18} strokeWidth={1.75} />
      </span>
      <span className={styles.detailText}>
        <span className={styles.detailLabel}>{label}</span>
        <span className={styles.detailValue}>{value}</span>
      </span>
    </li>
  );
}

export function ProfileScreen() {
  const router = useRouter();
  const setSession = useSetAtom(sessionAtom);
  const { data, error, isLoading, reload } = useResource("profile", loadProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (isLoading) {
    return (
      <div className={styles.screen}>
        <header className={styles.pageHeader}>
          <span className={styles.pageKicker}>Conta e preferências</span>
          <h1 className={styles.title}>Perfil</h1>
        </header>
        <Skeleton lines={5} label="Carregando seu perfil…" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.screen}>
        <header className={styles.pageHeader}>
          <span className={styles.pageKicker}>Conta e preferências</span>
          <h1 className={styles.title}>Perfil</h1>
        </header>
        <ErrorState
          message={error ?? "Não foi possível carregar o perfil."}
          onRetry={reload}
        />
      </div>
    );
  }

  const { user, summary, planCount } = data;
  const memberSince = formatDate(user.createdAt, user.timezone);

  function handleSaved(saved: UserSummary) {
    setSession((current) => (current ? { ...current, user: saved } : current));
    setIsEditing(false);
    notifySuccess("Informações atualizadas.");
    reload();
  }

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      await logout();
    } finally {
      setSession(null);
      router.replace("/signin");
    }
  }

  return (
    <div className={styles.screen}>
      <header className={styles.pageHeader}>
        <span className={styles.pageKicker}>Conta e preferências</span>
        <h1 className={styles.title}>Perfil</h1>
      </header>

      <section className={styles.hero} aria-label="Seu perfil">
        <div className={styles.heroTop}>
          <span className={styles.avatar} aria-hidden="true">
            {initialsOf(user.name)}
          </span>
          <div className={styles.identity}>
            <p className={styles.name}>{user.name}</p>
            <p className={styles.username}>@{user.username}</p>
          </div>
        </div>

        <div className={styles.chips}>
          <span className={styles.chip}>
            <CalendarDays size={14} strokeWidth={1.75} aria-hidden="true" />
            Membro desde {memberSince}
          </span>
          <span className={styles.chip}>
            <Globe size={14} strokeWidth={1.75} aria-hidden="true" />
            {timeZoneLabel(user.timezone)}
          </span>
        </div>

        <Button
          variant="secondary"
          fullWidth
          onClick={() => setIsEditing(true)}
        >
          <Pencil size={15} strokeWidth={1.75} aria-hidden="true" />
          Editar informações
        </Button>
      </section>

      <section className={styles.section} aria-label="Seus números">
        <SectionLabel>Resumo de atividade</SectionLabel>
        <div className={styles.stats}>
          <StatTile icon={Dumbbell} value={summary.totalCount} label="Treinos feitos" />
          <StatTile icon={CalendarCheck} value={summary.thisWeekCount} label="Esta semana" />
          <StatTile icon={ClipboardList} value={planCount} label="Rotinas ativas" />
        </div>
      </section>

      <section className={styles.section}>
        <SectionLabel>Dados da conta</SectionLabel>
        <div className={styles.details}>
          <ul className={styles.detailList}>
            <DetailRow icon={UserRound} label="Nome completo" value={user.name} />
            <DetailRow icon={AtSign} label="Usuário" value={`@${user.username}`} />
            <DetailRow icon={Mail} label="E-mail" value={user.email} />
            <DetailRow icon={Globe} label="Fuso horário" value={timeZoneLabel(user.timezone)} />
            <DetailRow icon={CalendarDays} label="Membro desde" value={memberSince} />
          </ul>
        </div>
      </section>

      <section className={styles.section}>
        <SectionLabel>Sessão</SectionLabel>
        <Button
          variant="secondary"
          fullWidth
          isLoading={isLoggingOut}
          onClick={handleLogout}
        >
          <LogOut size={16} aria-hidden="true" />
          Sair da conta
        </Button>
      </section>

      {isEditing ? (
        <EditProfileDialog
          user={user}
          onSaved={handleSaved}
          onClose={() => setIsEditing(false)}
        />
      ) : null}
    </div>
  );
}
