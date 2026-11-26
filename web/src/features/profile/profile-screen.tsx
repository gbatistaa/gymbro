"use client";

import {
  AtSign,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  Dumbbell,
  Globe,
  Mail,
  Pencil,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useSetAtom } from "jotai";
import { useState } from "react";
import { ErrorState } from "@/components/ui/error-state";
import { Notice } from "@/components/ui/notice";
import { Skeleton } from "@/components/ui/skeleton";
import { userSummarySchema, type UserSummary } from "@/contracts/auth";
import { completionSummarySchema, type CompletionSummary } from "@/contracts/completion";
import { playlistSummarySchema } from "@/contracts/playlist";
import { formatCount, formatDate } from "@/lib/format";
import { request } from "@/lib/http";
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
        <span className={`${styles.detailValue} text-text`}>{value}</span>
      </span>
    </li>
  );
}

export function ProfileScreen() {
  const setSession = useSetAtom(sessionAtom);
  const { data, error, isLoading, reload } = useResource("profile", loadProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className={styles.screen}>
        <Skeleton lines={8} label="Loading your profile…" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.screen}>
        <ErrorState message={error ?? "Could not load your profile."} onRetry={reload} />
      </div>
    );
  }

  const { user, summary, planCount } = data;
  const memberSince = formatDate(user.createdAt, user.timezone);

  function handleSaved(saved: UserSummary) {
    setSession((current) => (current ? { ...current, user: saved } : current));
    setIsEditing(false);
    setSavedMessage("Profile updated.");
    reload();
  }

  return (
    <div className={styles.screen}>
      <h1 className={styles.srOnly}>Profile</h1>

      {savedMessage ? <Notice tone="success">{savedMessage}</Notice> : null}

      <section className={styles.hero} aria-label="Your profile">
        <div className={styles.heroTop}>
          <span className={styles.avatar} aria-hidden="true">
            {initialsOf(user.name)}
          </span>
          <div className={styles.identity}>
            <p className={`${styles.name} text-text`}>{user.name}</p>
            <p className={styles.username}>@{user.username}</p>
          </div>
        </div>

        <div className={styles.chips}>
          <span className={styles.chip}>
            <CalendarDays size={14} strokeWidth={1.75} aria-hidden="true" />
            Member since {memberSince}
          </span>
          <span className={styles.chip}>
            <Globe size={14} strokeWidth={1.75} aria-hidden="true" />
            {timeZoneLabel(user.timezone)}
          </span>
        </div>

        <button type="button" className={styles.editButton} onClick={() => setIsEditing(true)}>
          <Pencil size={16} strokeWidth={1.75} aria-hidden="true" />
          Edit profile
        </button>
      </section>

      <section className={styles.stats} aria-label="Your numbers">
        <StatTile icon={Dumbbell} value={summary.totalCount} label="Workouts logged" />
        <StatTile icon={CalendarCheck} value={summary.thisWeekCount} label="This week" />
        <StatTile icon={ClipboardList} value={planCount} label="Workout plans" />
      </section>

      <section className={styles.details}>
        <h2 className={styles.detailsTitle}>Account details</h2>
        <ul className={styles.detailList}>
          <DetailRow icon={UserRound} label="Full name" value={user.name} />
          <DetailRow icon={AtSign} label="Username" value={`@${user.username}`} />
          <DetailRow icon={Mail} label="Email" value={user.email} />
          <DetailRow icon={Globe} label="Time zone" value={timeZoneLabel(user.timezone)} />
          <DetailRow icon={CalendarDays} label="Member since" value={memberSince} />
        </ul>
      </section>

      {isEditing ? (
        <EditProfileDialog user={user} onSaved={handleSaved} onClose={() => setIsEditing(false)} />
      ) : null}
    </div>
  );
}
