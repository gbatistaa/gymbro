"use client";

import { Dumbbell } from "lucide-react";
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
  const user = useAtomValue(sessionAtom)?.user;
  const userInitials = initialsOf(user?.name);

  return (
    <header className={styles.topBar}>
      <div className={styles.topBarInner}>
        <Link href="/" className={styles.brandGroup}>
          <span className={styles.brandMark} aria-hidden="true">
            <Dumbbell size={18} strokeWidth={2} />
          </span>
          <span className={styles.brandWordmark}>GYMBRO</span>
        </Link>

        <div className={styles.topActions}>
          <Link
            href="/profile"
            className={styles.avatarBadge}
            aria-label="Abrir perfil"
          >
            {user?.username ? (
              <span className={styles.topUserHandle}>@{user.username}</span>
            ) : null}
            <span className={styles.avatarCircle}>
              {userInitials}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
