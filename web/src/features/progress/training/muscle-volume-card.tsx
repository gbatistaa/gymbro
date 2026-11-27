import { BarChart3 } from "lucide-react";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { MuscleVolume } from "@/contracts/analytics";
import { formatCount, formatVolume } from "@/lib/format";
import styles from "../progress.module.css";

/** Distribuição das séries por grupo muscular nas últimas 12 semanas. */
export function MuscleVolumeCard({ muscles }: { muscles: readonly MuscleVolume[] }) {
  const maxSets = Math.max(1, ...muscles.map((muscle) => muscle.sets));

  return (
    <section className={styles.section} aria-labelledby="muscles-title">
      <div className={styles.sectionHeader}>
        <h2 id="muscles-title" className={styles.sectionTitle}>Séries por músculo</h2>
        <span className={styles.sectionCount}>últimas 12 semanas</span>
      </div>

      {muscles.length === 0 ? (
        <SurfaceCard className={styles.pinnedEmpty}>
          <BarChart3 size={20} strokeWidth={1.75} className={styles.pinnedEmptyIcon} aria-hidden="true" />
          <p className={styles.pinnedEmptyText}>
            Registre séries com carga para ver a distribuição por grupo muscular.
          </p>
        </SurfaceCard>
      ) : (
        <SurfaceCard className={styles.muscleCard}>
          <ul className={styles.muscleList}>
            {muscles.map((muscle) => (
              <li key={muscle.muscle} className={styles.muscleRow}>
                <div className={styles.muscleTop}>
                  <span className={styles.muscleName}>{muscle.muscle}</span>
                  <span className={styles.muscleStats}>
                    <strong>{formatCount(muscle.sets)}</strong> {muscle.sets === 1 ? "série" : "séries"} ·{" "}
                    {formatVolume(muscle.volume)}
                  </span>
                </div>
                <div className={styles.muscleTrack} aria-hidden="true">
                  <div
                    className={styles.muscleFill}
                    style={{ width: `${Math.max(4, Math.round((muscle.sets / maxSets) * 100))}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </SurfaceCard>
      )}
    </section>
  );
}
