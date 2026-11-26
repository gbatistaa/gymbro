import { Flame, TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/ui/section-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import styles from "./home.module.css";

export type WeeklyMetric = {
  id: "workouts" | "volume" | "streak" | "weight";
  label: string;
  value: string;
  unit?: string;
  footer: string;
  badgeText?: string;
  trend?: { text: string; direction: "up" | "down" };
  hasFlameIcon?: boolean;
};

type WeeklyStatsGridProps = {
  sectionLabel: string;
  metrics: readonly WeeklyMetric[];
};

export function WeeklyStatsGrid({ sectionLabel, metrics }: WeeklyStatsGridProps) {
  return (
    <section className={styles.section}>
      <SectionHeader>{sectionLabel}</SectionHeader>

      <div className={styles.statsGrid}>
        {metrics.map((metric) => (
          <SurfaceCard key={metric.id} as="article" className={styles.statCard}>
            <div className={styles.statHeader}>
              <span className={`${styles.statLabel} text-muted`}>{metric.label}</span>

              {metric.badgeText ? (
                <Badge tone="primary" className="tabular-nums">
                  {metric.badgeText}
                </Badge>
              ) : null}

              {metric.trend ? (
                <span className={`${styles.statTrend} tabular-nums text-primary`}>
                  {metric.trend.direction === "up" ? (
                    <TrendingUp size={12} strokeWidth={1.75} aria-hidden="true" />
                  ) : (
                    <TrendingDown size={12} strokeWidth={1.75} aria-hidden="true" />
                  )}
                  <span>{metric.trend.text}</span>
                </span>
              ) : null}

              {metric.hasFlameIcon ? (
                <span className="text-primary" aria-hidden="true">
                  <Flame size={14} strokeWidth={1.75} />
                </span>
              ) : null}
            </div>

            <div className={styles.statValueRow}>
              <div className={`${styles.statNumberGroup} tabular-nums`}>
                <span className={`${styles.statValue} text-text`}>{metric.value}</span>
                {metric.unit ? (
                  <span className={`${styles.statUnit} text-muted`}>{metric.unit}</span>
                ) : null}
              </div>
            </div>

            <p className={`${styles.statFooter} tabular-nums text-muted`}>{metric.footer}</p>
          </SurfaceCard>
        ))}
      </div>
    </section>
  );
}
