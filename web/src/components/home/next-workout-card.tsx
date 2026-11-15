import { Flag, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PrimaryLinkButton } from "@/components/ui/primary-button";
import { SectionHeader } from "@/components/ui/section-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { NextWorkoutData } from "@/lib/mock-data";
import styles from "./home.module.css";

type NextWorkoutCardProps = {
  workout: NextWorkoutData;
};

export function NextWorkoutCard({ workout }: NextWorkoutCardProps) {
  return (
    <section className={styles.section}>
      <SectionHeader>{workout.sectionLabel}</SectionHeader>

      <SurfaceCard as="div" className={styles.nextWorkoutCard}>
        <div className={styles.routineHeaderRow}>
          <div className={styles.routineTitleGroup}>
            <h3 className={`${styles.routineTitle} text-text`}>{workout.routineTitle}</h3>
            <p className={`${styles.routineSubtitle} text-muted`}>{workout.scheduleMeta}</p>
          </div>

          <Badge tone="neutral">{workout.statusBadge}</Badge>
        </div>

        <div className={`${styles.targetPreviewBox} bg-surface-2 border-token radius-btn`}>
          <div className={styles.targetExerciseLeft}>
            <span className={`${styles.targetIcon} text-muted`} aria-hidden="true">
              <Flag size={16} strokeWidth={1.75} />
            </span>
            <p className={styles.targetExerciseText}>
              <span className={`${styles.targetExerciseName} text-text`}>
                {workout.targetExercise.name}
              </span>
              <span className={`${styles.targetExerciseSep} text-muted`}>·</span>
              <span className={`${styles.targetExerciseLoad} tabular-nums text-muted`}>
                {workout.targetExercise.prescription}
              </span>
            </p>
          </div>

          <Badge tone="primary" className="tabular-nums">
            {workout.targetExercise.progressionBadge}
          </Badge>
        </div>

        <PrimaryLinkButton
          href={workout.href}
          fullWidth
          icon={<Play size={16} strokeWidth={1.75} />}
        >
          {workout.ctaLabel}
        </PrimaryLinkButton>
      </SurfaceCard>
    </section>
  );
}
