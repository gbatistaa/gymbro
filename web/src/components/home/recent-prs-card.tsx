import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/ui/section-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { RecentPrItem } from "@/lib/mock-data";
import styles from "./home.module.css";

type RecentPrsCardProps = {
  sectionLabel: string;
  items: RecentPrItem[];
};

export function RecentPrsCard({ sectionLabel, items }: RecentPrsCardProps) {
  return (
    <section className={styles.section}>
      <SectionHeader icon={<Trophy size={15} strokeWidth={1.75} />}>
        {sectionLabel}
      </SectionHeader>

      <SurfaceCard as="div" className={styles.prsCard}>
        <ul className={styles.prsList}>
          {items.map((item) => (
            <li key={item.id} className={styles.prItem}>
              <div className={styles.prLeft}>
                <div className={styles.prTitleRow}>
                  <span className={`${styles.prExerciseName} text-text`}>
                    {item.exerciseName}
                  </span>
                  <Badge tone="primary">{item.badge}</Badge>
                </div>

                <div className={`${styles.prMetaRow} tabular-nums text-muted`}>
                  <span>
                    {item.e1rmLabel}{" "}
                    <span className={`${styles.prMetaStrong} text-text`}>
                      {item.e1rmValue}
                    </span>
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
      </SurfaceCard>
    </section>
  );
}
