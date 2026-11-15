import { Bell, Dumbbell } from "lucide-react";
import Link from "next/link";
import styles from "./shell.module.css";

type TopBarProps = {
  userInitials?: string;
};

export function TopBar({ userInitials = "FL" }: TopBarProps) {
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
            aria-label={`Perfil de ${userInitials}`}
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
