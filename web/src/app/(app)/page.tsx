import type { Metadata } from "next";
import { ActiveSessionCard } from "@/components/home/active-session-card";
import styles from "@/components/home/home.module.css";
import { NextWorkoutCard } from "@/components/home/next-workout-card";
import { RecentPrsCard } from "@/components/home/recent-prs-card";
import { VolumeChartCard } from "@/components/home/volume-chart-card";
import { WeeklyStatsGrid } from "@/components/home/weekly-stats-grid";
import { HOME_MOCK_DATA } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Início",
};

export default function HomePage() {
  return (
    <div className={styles.screen}>
      <ActiveSessionCard session={HOME_MOCK_DATA.activeSession} />
      <NextWorkoutCard workout={HOME_MOCK_DATA.nextWorkout} />
      <WeeklyStatsGrid
        sectionLabel={HOME_MOCK_DATA.weeklyMetricsSectionLabel}
        metrics={HOME_MOCK_DATA.weeklyMetrics}
      />
      <VolumeChartCard chart={HOME_MOCK_DATA.volumeChart} />
      <RecentPrsCard
        sectionLabel={HOME_MOCK_DATA.recentPrsSectionLabel}
        items={HOME_MOCK_DATA.recentPrs}
      />
    </div>
  );
}
