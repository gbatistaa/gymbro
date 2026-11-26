"use client";

import { ClipboardCheck, MoreHorizontal, SquarePen } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { PrimaryButton } from "@/components/ui/primary-button";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { PlaylistSummary } from "@/contracts/playlist";
import { formatCount, formatKg, formatRelative } from "@/lib/format";
import { formatPrescription } from "./exercise-entries";
import styles from "./plans.module.css";

const PREVIEW_LIMIT = 4;

type PlanCardProps = {
  plan: PlaylistSummary;
  timezone: string;
  onLog: (plan: PlaylistSummary) => void;
  onDuplicate: (plan: PlaylistSummary) => void;
  onArchive: (plan: PlaylistSummary) => void;
};

function totalSets(plan: PlaylistSummary): number {
  return plan.exercises.reduce((sum, item) => sum + (item.targetSets ?? 0), 0);
}

function muscleSummary(plan: PlaylistSummary): string | null {
  const muscles = [
    ...new Set(
      plan.exercises
        .map((item) => item.primaryMuscle)
        .filter((muscle): muscle is string => Boolean(muscle)),
    ),
  ];
  if (muscles.length === 0) return null;
  return muscles.length > 3 ? `${muscles.slice(0, 3).join(", ")} +${muscles.length - 3}` : muscles.join(", ");
}

export function PlanCard({ plan, timezone, onLog, onDuplicate, onArchive }: PlanCardProps) {
  const isArchived = plan.archivedAt != null;
  const preview = plan.exercises.slice(0, PREVIEW_LIMIT);
  const hidden = plan.exercises.length - preview.length;
  const muscles = muscleSummary(plan);

  return (
    <SurfaceCard as="article" className={styles.routineCard}>
      <div className={styles.routineTopRow}>
        <div className={styles.routineHeaderLeft}>
          <div className={styles.routineBadgeRow}>
            {isArchived ? <Badge>Archived</Badge> : null}
            <p className={`${styles.lastPerformed} tabular-nums text-muted`}>
              {plan.lastPerformedAt
                ? `Last done ${formatRelative(plan.lastPerformedAt, timezone)}`
                : "Not done yet"}
            </p>
          </div>

          <h2 className={`${styles.routineTitle} text-text`}>{plan.name}</h2>
        </div>

        <PlanMenu
          planName={plan.name}
          isArchived={isArchived}
          onDuplicate={() => onDuplicate(plan)}
          onArchive={() => onArchive(plan)}
        />
      </div>

      <div className={`${styles.ledgerRow} tabular-nums text-muted`}>
        <span>
          {formatCount(plan.exerciseCount)} {plan.exerciseCount === 1 ? "exercise" : "exercises"}
        </span>
        <span className={styles.ledgerDot} aria-hidden="true">
          •
        </span>
        <span>{formatCount(totalSets(plan))} sets</span>
        {muscles ? (
          <>
            <span className={styles.ledgerDot} aria-hidden="true">
              •
            </span>
            <span>{muscles}</span>
          </>
        ) : null}
      </div>

      {preview.length > 0 ? (
        <ul className={`${styles.exerciseRowsBox} bg-surface-2 border-token radius-btn`}>
          {preview.map((item) => (
            <li key={item.id} className={styles.exerciseRow}>
              <span className={`${styles.exerciseName} text-text`}>
                {item.exerciseName}
                {item.primaryMuscle ? (
                  <span className={styles.exerciseMeta}>{item.primaryMuscle}</span>
                ) : null}
              </span>
              <span className={`${styles.exercisePrescription} tabular-nums text-muted`}>
                {formatPrescription(item, formatKg)}
              </span>
            </li>
          ))}
          {hidden > 0 ? (
            <li className={`${styles.exerciseRow} ${styles.moreExercises}`}>
              +{hidden} more
            </li>
          ) : null}
        </ul>
      ) : (
        <p className={styles.emptyHint}>No exercises in this plan yet.</p>
      )}

      {isArchived ? null : (
        <div className={styles.routineActionsRow}>
          <PrimaryButton
            fullWidth
            icon={<ClipboardCheck size={16} strokeWidth={1.75} />}
            onClick={() => onLog(plan)}
          >
            Log workout
          </PrimaryButton>

          <Link
            href={`/train/playlists/${plan.id}`}
            className={`${styles.editRoutineButton} bg-surface-2 border-token text-text radius-btn`}
            aria-label={`Edit ${plan.name}`}
          >
            <SquarePen size={16} strokeWidth={1.75} aria-hidden="true" />
          </Link>
        </div>
      )}
    </SurfaceCard>
  );
}

type PlanMenuProps = {
  planName: string;
  isArchived: boolean;
  onDuplicate: () => void;
  onArchive: () => void;
};

function PlanMenu({ planName, isArchived, onDuplicate, onArchive }: PlanMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function closeOnOutside(event: PointerEvent) {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  function choose(action: () => void) {
    setIsOpen(false);
    action();
  }

  return (
    <div ref={containerRef}>
      <button
        type="button"
        className={`${styles.optionsButton} text-muted`}
        aria-label={`Options for ${planName}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <MoreHorizontal size={16} strokeWidth={1.75} aria-hidden="true" />
      </button>

      {isOpen ? (
        <div className={styles.menu} role="menu">
          <button type="button" role="menuitem" className={styles.menuItem} onClick={() => choose(onDuplicate)}>
            Duplicate
          </button>
          {isArchived ? null : (
            <button
              type="button"
              role="menuitem"
              className={`${styles.menuItem} ${styles.menuItemDanger}`}
              onClick={() => choose(onArchive)}
            >
              Archive
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
