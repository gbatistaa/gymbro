import { ChevronRight, Pin } from "lucide-react";
import type { ExerciseProgressSort, ExerciseProgressSummary } from "@/contracts/progress";
import { formatCount, formatKg, formatRelative, formatVolume } from "@/lib/format";
import styles from "../progress.module.css";

type Stat = { value: string; label: string };

/** O número em destaque acompanha a ordenação escolhida, para a lista ler como um ranking. */
function highlightedStat(exercise: ExerciseProgressSummary, sort: ExerciseProgressSort): Stat {
  switch (sort) {
    case "BEST_E1RM":
      return { value: `${formatKg(exercise.bestE1rm)} kg`, label: "1RM est." };
    case "TOTAL_VOLUME":
      return { value: formatVolume(exercise.totalVolume), label: "volume" };
    case "SESSION_COUNT":
      return { value: formatCount(exercise.sessionCount), label: exercise.sessionCount === 1 ? "sessão" : "sessões" };
    case "TOTAL_SETS":
      return { value: formatCount(exercise.totalSets), label: exercise.totalSets === 1 ? "série" : "séries" };
    default:
      return { value: `${formatKg(exercise.bestWeight)} kg`, label: "carga máx." };
  }
}

type ExerciseProgressRowProps = {
  exercise: ExerciseProgressSummary;
  sort: ExerciseProgressSort;
  timeZone: string;
  onOpen: () => void;
};

export function ExerciseProgressRow({ exercise, sort, timeZone, onOpen }: ExerciseProgressRowProps) {
  const stat = highlightedStat(exercise, sort);

  return (
    <button type="button" className={styles.exerciseRow} onClick={onOpen}>
      <span className={styles.exerciseMain}>
        <span className={styles.exerciseName}>
          <span className={styles.exerciseNameText}>{exercise.name}</span>
          {exercise.isPinned ? (
            <>
              <Pin size={12} strokeWidth={2} className={styles.exercisePinned} aria-hidden="true" />
              <span className={styles.srOnly}>(fixado)</span>
            </>
          ) : null}
        </span>
        <span className={styles.exerciseMeta}>
          {exercise.primaryMuscle} · {formatRelative(exercise.lastPerformedAt, timeZone)}
        </span>
      </span>
      <span className={styles.exerciseStat}>
        <strong className={styles.exerciseStatValue}>{stat.value}</strong>
        <span className={styles.exerciseStatLabel}>{stat.label}</span>
      </span>
      <ChevronRight size={16} strokeWidth={1.75} className={styles.exerciseChevron} aria-hidden="true" />
    </button>
  );
}
