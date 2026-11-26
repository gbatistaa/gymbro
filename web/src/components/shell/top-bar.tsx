"use client";

import { Bell, Dumbbell } from "lucide-react";
import { useAtomValue } from "jotai";
import Link from "next/link";
import { sessionAtom } from "@/stores/session";
import styles from "./shell.module.css";

/** Iniciais do nome para o avatar, ex.: "Gabriel Batista" → "GB". */
function initialsOf(name: string | undefined): string {
  const initials = (name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "?";
}

export function TopBar() {
  const userInitials = initialsOf(useAtomValue(sessionAtom)?.user.name);

  return (
    <header className={`${styles.topBar} bg-surface border-token`}>
      <div className={styles.topBarInner}>
        <Link href="/" className={`${styles.brandGroup} text-text`}>
          <span className={`${styles.brandMark} bg-surface-2 border-token text-primary`} aria-hidden="true">
            <Dumbbell size={18} strokeWidth={1.75} />
          </span>
          <span className={styles.brandWordmark}>GYMBRO</span>
        </Link>

        <div className={styles.topActions}>
          <button
            type="button"
            className={`${styles.iconButton} text-muted`}
            aria-label="Notificações"
          >
            <Bell size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>

          <Link
            href="/profile"
            className={styles.avatarBadge}
            aria-label="Perfil"
          >
            <span className={`${styles.avatarCircle} bg-surface-2 border-token text-text`}>
              {userInitials}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
