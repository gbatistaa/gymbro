import type { CSSProperties } from "react";
import { SectionHeader } from "@/components/ui/section-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import styles from "./home.module.css";

export type VolumeBar = {
  id: string;
  weekLabel: string;
  volumeLabel: string;
  /** 0–100, relative to the tallest week. */
  heightPercent: number;
  isCurrent: boolean;
  topTag?: string;
};

export type VolumeChart = {
  sectionLabel: string;
  title: string;
  averageLabel: string;
  averageValue: string;
  averageUnit: string;
  /** 0–1, where the dashed average line sits. */
  averagePosition: number;
  benchmarkTag: string;
  bars: readonly VolumeBar[];
  startLabel: string;
  currentLabel: string;
};

type BenchmarkStyle = CSSProperties & { "--benchmark": string };

function barClass(bar: VolumeBar): string {
  if (bar.heightPercent === 0) return styles.barFillEmpty;
  return bar.isCurrent ? `${styles.barFillCurrent} bg-primary` : "bg-surface-2";
}

export function VolumeChartCard({ chart }: { chart: VolumeChart }) {
  const benchmarkStyle: BenchmarkStyle = { "--benchmark": String(chart.averagePosition) };

  return (
    <section className={styles.section}>
      <SectionHeader>{chart.sectionLabel}</SectionHeader>

      <SurfaceCard as="div" className={styles.chartCard}>
        <div className={styles.chartTopRow}>
          <h3 className={`${styles.chartTitle} text-text`}>{chart.title}</h3>
          <p className={`${styles.chartAverage} tabular-nums text-muted`}>
            <span>{chart.averageLabel} </span>
            <span className={`${styles.chartAverageStrong} text-text`}>{chart.averageValue}</span>
            <span> {chart.averageUnit}</span>
          </p>
        </div>

        <div
          className={styles.chartCanvas}
          role="img"
          aria-label={`Training volume over the last ${chart.bars.length} weeks`}
        >
          {chart.averagePosition > 0 ? (
            <div className={styles.benchmarkLine} style={benchmarkStyle} aria-hidden="true">
              <span className={`${styles.benchmarkTag} tabular-nums text-muted`}>
                {chart.benchmarkTag}
              </span>
            </div>
          ) : null}

          <div className={styles.barsRow}>
            {chart.bars.map((bar) => (
              <div key={bar.id} className={styles.barColumn}>
                {bar.topTag ? (
                  <span className={`${styles.barTopTag} tabular-nums text-primary`}>{bar.topTag}</span>
                ) : null}
                <div
                  className={`${styles.barFill} ${barClass(bar)}`}
                  style={{ height: `${Math.max(bar.heightPercent, 2)}%` }}
                  title={`${bar.weekLabel}: ${bar.volumeLabel}`}
                />
              </div>
            ))}
          </div>
        </div>

        <div className={`${styles.chartLegend} tabular-nums text-muted`}>
          <span>{chart.startLabel}</span>
          <span className={styles.legendItem}>
            <span className={styles.legendDot} aria-hidden="true" />
            <span>Weekly volume</span>
          </span>
          <span className={`${styles.legendCurrent} text-primary`}>{chart.currentLabel}</span>
        </div>
      </SurfaceCard>
    </section>
  );
}
