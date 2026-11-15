import { Flame, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/ui/section-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { WeeklyMetricCardData } from "@/lib/mock-data";
import styles from "./home.module.css";

type WeeklyStatsGridProps = {
  sectionLabel: string;
  metrics: WeeklyMetricCardData[];
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

              {metric.trendText ? (
                <span className={`${styles.statTrend} tabular-nums text-primary`}>
                  {metric.id === "volume" ? (
                    <TrendingUp size={12} strokeWidth={1.75} aria-hidden="true" />
                  ) : null}
                  <span>{metric.trendText}</span>
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
                {metric.secondaryValue ? (
                  <span className={`${styles.statUnit} text-muted`}>
                    {metric.secondaryValue}
                  </span>
                ) : null}
                {metric.unit ? (
                  <span className={`${styles.statUnit} text-muted`}>{metric.unit}</span>
                ) : null}
              </div>

              {metric.hasSparkline ? (
                <span className={`${styles.sparkline} text-primary`} aria-hidden="true">
                  <svg viewBox="0 0 56 24" width="56" height="24" fill="none">
                    <path
                      d="M2 6C12 6 18 11 28 13C38 15 44 18 52 17"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                    />
                    <circle cx="52" cy="17" r="2.5" fill="currentColor" />
                  </svg>
                </span>
              ) : null}
            </div>

            <p className={`${styles.statFooter} tabular-nums text-muted`}>{metric.footer}</p>
          </SurfaceCard>
        ))}
      </div>
    </section>
  );
}
