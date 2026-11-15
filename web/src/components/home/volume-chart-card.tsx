import { SectionHeader } from "@/components/ui/section-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { VolumeChartData, WeeklyVolumeBar } from "@/lib/mock-data";
import styles from "./home.module.css";

const HEIGHT_CLASS_BY_PERCENT: Record<number, string> = {
  38: styles.barH38,
  42: styles.barH42,
  52: styles.barH52,
  54: styles.barH54,
  58: styles.barH58,
  64: styles.barH64,
  68: styles.barH68,
  72: styles.barH72,
  76: styles.barH76,
  77: styles.barH77,
  79: styles.barH79,
  82: styles.barH82,
};

function getBarVariantClass(variant: WeeklyVolumeBar["variant"]) {
  if (variant === "deload") return styles.barFillDeload;
  if (variant === "current") return `${styles.barFillCurrent} bg-primary`;
  return `${styles.barFill} bg-surface-2`;
}

type VolumeChartCardProps = {
  chart: VolumeChartData;
};

export function VolumeChartCard({ chart }: VolumeChartCardProps) {
  return (
    <section className={styles.section}>
      <SectionHeader>{chart.sectionLabel}</SectionHeader>

      <SurfaceCard as="div" className={styles.chartCard}>
        <div className={styles.chartTopRow}>
          <h3 className={`${styles.chartTitle} text-text`}>{chart.title}</h3>
          <p className={`${styles.chartAverage} tabular-nums text-muted`}>
            <span>{chart.averageLabel} </span>
            <span className={`${styles.chartAverageStrong} text-text`}>
              {chart.averageValue}
            </span>
            <span> {chart.averageUnit}</span>
          </p>
        </div>

        <div className={styles.chartCanvas} role="img" aria-label="Evolução do volume nas últimas 12 semanas">
          <div className={styles.benchmarkLine} aria-hidden="true">
            <span className={`${styles.benchmarkTag} tabular-nums text-muted`}>
              {chart.benchmarkTag}
            </span>
          </div>

          <div className={styles.barsRow}>
            {chart.bars.map((bar) => (
              <div key={bar.id} className={styles.barColumn}>
                {bar.topTag ? (
                  <span className={`${styles.barTopTag} tabular-nums text-primary`}>
                    {bar.topTag}
                  </span>
                ) : null}
                <div
                  className={[
                    styles.barFill,
                    getBarVariantClass(bar.variant),
                    HEIGHT_CLASS_BY_PERCENT[bar.heightPercent] ?? styles.barH64,
                  ].join(" ")}
                  title={`${bar.weekLabel}: ${bar.volumeKg.toLocaleString("pt-BR")} kg`}
                />
              </div>
            ))}
          </div>
        </div>

        <div className={`${styles.chartLegend} tabular-nums text-muted`}>
          <span>{chart.legend.startLabel}</span>
          <span className={styles.legendItem}>
            <span className={styles.legendDot} aria-hidden="true" />
            <span>{chart.legend.deloadFirstLabel}</span>
          </span>
          <span className={styles.legendItem}>
            <span className={styles.legendDot} aria-hidden="true" />
            <span>{chart.legend.deloadSecondLabel}</span>
          </span>
          <span className={`${styles.legendCurrent} text-primary`}>
            {chart.legend.currentLabel}
          </span>
        </div>
      </SurfaceCard>
    </section>
  );
}
