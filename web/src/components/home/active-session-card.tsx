import { Clock, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PrimaryLinkButton } from "@/components/ui/primary-button";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { ActiveSessionData } from "@/lib/mock-data";
import styles from "./home.module.css";

type ActiveSessionCardProps = {
  session: ActiveSessionData;
};

export function ActiveSessionCard({ session }: ActiveSessionCardProps) {
  return (
    <SurfaceCard className={styles.activeCard} aria-labelledby="active-session-heading">
      <div className={styles.telemetryHeader}>
        <span className={`${styles.telemetryStatus} text-primary`}>
          <span className={`${styles.liveDot} bg-primary`} aria-hidden="true" />
          <span>{session.statusLabel}</span>
        </span>

        <span className={`${styles.telemetryTimer} tabular-nums text-text`}>
          <span className={`${styles.telemetryTimerIcon} text-primary`} aria-hidden="true">
            <Clock size={14} strokeWidth={1.75} />
          </span>
          <span>{session.elapsed}</span>
        </span>
      </div>

      <div className={styles.routineMetaBlock}>
        <div className={styles.routineHeaderRow}>
          <div className={styles.routineTitleGroup}>
            <h2 id="active-session-heading" className={`${styles.routineTitle} text-text`}>
              {session.routineTitle}
            </h2>
            <p className={`${styles.routineSubtitle} text-muted`}>
              {session.completedSetsText}
            </p>
          </div>

          <Badge tone="neutral" className="tabular-nums">
            {session.setBadge}
          </Badge>
        </div>

        <div
          className={`${styles.progressTrack} bg-surface-2`}
          role="progressbar"
          aria-valuenow={session.progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progresso de séries"
        >
          <div className={`${styles.progressFill} bg-primary`} />
        </div>

        <div className={`${styles.cumulativeVolumeRow} tabular-nums`}>
          <span className={`${styles.volumeLabel} text-muted`}>{session.volumeLabel}</span>
          <span className={`${styles.volumeNumber} text-text`}>{session.volumeValue}</span>
          <span className={`${styles.volumeUnit} text-muted`}>{session.volumeUnit}</span>
        </div>
      </div>

      <PrimaryLinkButton
        href={session.href}
        fullWidth
        icon={<Play size={18} strokeWidth={1.75} />}
      >
        {session.ctaLabel}
      </PrimaryLinkButton>
    </SurfaceCard>
  );
}
