import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/ui/section-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import styles from "./home.module.css";

export type RecentPr = {
  id: string;
  exerciseName: string;
  e1rmValue: string;
  relativeDate: string;
  weight: string;
  repsUnit: string;
};

type RecentPrsCardProps = {
  sectionLabel: string;
  items: readonly RecentPr[];
};

export function RecentPrsCard({ sectionLabel, items }: RecentPrsCardProps) {
  return (
    <section className={styles.section}>
      <SectionHeader icon={<Trophy size={15} strokeWidth={1.75} />}>{sectionLabel}</SectionHeader>

      <SurfaceCard as="div" className={styles.prsCard}>
        {items.length === 0 ? (
          <p className={styles.emptyText}>
            Registre um treino com carga para acompanhar seus recordes pessoais.
          </p>
        ) : (
          <ul className={styles.prsList}>
            {items.map((item) => (
              <li key={item.id} className={styles.prItem}>
                <div className={styles.prLeft}>
                  <div className={styles.prTitleRow}>
                    <span className={`${styles.prExerciseName} text-text`}>{item.exerciseName}</span>
                    <Badge tone="primary">PR</Badge>
                  </div>

                  <div className={`${styles.prMetaRow} tabular-nums text-muted`}>
                    <span>
                      e1RM <span className={`${styles.prMetaStrong} text-text`}>{item.e1rmValue}</span>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{item.relativeDate}</span>
                  </div>
                </div>

                <div className={`${styles.prRight} tabular-nums`}>
                  <span className={`${styles.prWeight} text-text`}>{item.weight}</span>
                  <span className={`${styles.prReps} text-muted`}>{item.repsUnit}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SurfaceCard>
    </section>
  );
}
