import { MoreHorizontal, Play, SquarePen } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { PrimaryLinkButton } from "@/components/ui/primary-button";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { RoutineCardData } from "@/lib/mock-data";
import styles from "./train.module.css";

type RoutineCardProps = {
  routine: RoutineCardData;
};

export function RoutineCard({ routine }: RoutineCardProps) {
  return (
    <SurfaceCard as="article" className={styles.routineCard}>
      <div className={styles.routineTopRow}>
        <div className={styles.routineHeaderLeft}>
          <div className={styles.routineBadgeRow}>
            {routine.highlightBadge ? (
              <Badge tone={routine.badgeTone === "primary" ? "strong" : "neutral"}>
                {routine.highlightBadge}
              </Badge>
            ) : null}
            <p className={`${styles.lastPerformed} tabular-nums text-muted`}>
              {routine.lastPerformedLabel}
            </p>
          </div>

          <h2 className={`${styles.routineTitle} text-text`}>{routine.title}</h2>
        </div>

        <button
          type="button"
          className={`${styles.optionsButton} text-muted`}
          aria-label={`Opções da rotina ${routine.title}`}
        >
          <MoreHorizontal size={16} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>

      <div className={`${styles.ledgerRow} tabular-nums text-muted`}>
        <span>{routine.exerciseCountLabel}</span>
        <span className={styles.ledgerDot} aria-hidden="true">
          •
        </span>
        <span>{routine.durationLabel}</span>
        <span className={styles.ledgerDot} aria-hidden="true">
          •
        </span>
        <span>{routine.volumeLabel}</span>
      </div>

      <ul className={`${styles.exerciseRowsBox} bg-surface-2 border-token radius-btn`}>
        {routine.exercises.map((exercise) => (
          <li key={exercise.id} className={styles.exerciseRow}>
            <span className={`${styles.exerciseName} text-text`}>{exercise.name}</span>
            <span className={`${styles.exercisePrescription} tabular-nums text-muted`}>
              {exercise.prescription}
            </span>
          </li>
        ))}
      </ul>

      <div className={styles.routineActionsRow}>
        <PrimaryLinkButton
          href={routine.href}
          fullWidth
          icon={<Play size={16} strokeWidth={1.75} />}
        >
          {routine.ctaLabel}
        </PrimaryLinkButton>

        <Link
          href={routine.href}
          className={`${styles.editRoutineButton} bg-surface-2 border-token text-text radius-btn`}
          aria-label={`Editar rotina ${routine.title}`}
        >
          <SquarePen size={16} strokeWidth={1.75} aria-hidden="true" />
        </Link>
      </div>
    </SurfaceCard>
  );
}
