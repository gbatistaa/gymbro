import type { RecentPr } from "@/components/home/recent-prs-card";
import type { VolumeChart } from "@/components/home/volume-chart-card";
import type { WeeklyMetric } from "@/components/home/weekly-stats-grid";
import type { Dashboard } from "@/contracts/analytics";
import type { CompletionSummary } from "@/contracts/completion";
import {
  formatCompact,
  formatCount,
  formatKg,
  formatRelative,
  formatShortDate,
  formatVolume,
} from "@/lib/format";

/** Bars stop below the top so the current-week tag fits above the tallest bar. */
const BAR_CEILING = 85;
const PR_LIMIT = 5;

function signed(value: number): string {
  if (value > 0) return `+${formatKg(value)}`;
  if (value < 0) return `−${formatKg(Math.abs(value))}`;
  return formatKg(0);
}

function volumeMetric(dashboard: Dashboard): WeeklyMetric {
  const current = dashboard.weeks.at(-1)?.volume ?? 0;
  const previous = dashboard.weeks.at(-2)?.volume ?? 0;

  if (previous <= 0) {
    return {
      id: "volume",
      label: "Weekly volume",
      value: formatKg(current),
      unit: "kg",
      footer: current > 0 ? "No volume last week" : "No volume logged this week",
    };
  }

  const change = Math.round(((current - previous) / previous) * 100);
  return {
    id: "volume",
    label: "Weekly volume",
    value: formatKg(current),
    unit: "kg",
    trend: { text: `${change > 0 ? "+" : ""}${change}%`, direction: change >= 0 ? "up" : "down" },
    footer: `${signed(current - previous)} kg vs last week`,
  };
}

export function weeklyMetrics(dashboard: Dashboard, summary: CompletionSummary): WeeklyMetric[] {
  const workouts = dashboard.weeks.at(-1)?.sessions ?? summary.thisWeekCount;
  const streak = dashboard.currentStreakWeeks;
  const weightDelta = dashboard.weightDeltaKg;

  return [
    {
      id: "workouts",
      label: "Workouts",
      value: formatCount(workouts),
      footer: `${formatCount(summary.totalCount)} logged in total`,
    },
    volumeMetric(dashboard),
    {
      id: "streak",
      label: "Active streak",
      value: formatCount(streak),
      unit: streak === 1 ? "week" : "weeks",
      hasFlameIcon: streak > 0,
      footer: streak > 0 ? "Weeks in a row with a workout" : "Log a workout to start one",
    },
    {
      id: "weight",
      label: "Body weight",
      value: weightDelta == null ? "—" : signed(weightDelta),
      unit: weightDelta == null ? undefined : "kg",
      footer: weightDelta == null ? "No body measurements yet" : "Change across your measurements",
    },
  ];
}

export function volumeChart(dashboard: Dashboard): VolumeChart {
  const { weeks, timezone } = dashboard;
  const max = Math.max(0, ...weeks.map((week) => week.volume));
  const trainedWeeks = weeks.filter((week) => week.volume > 0);
  const average =
    trainedWeeks.length === 0
      ? 0
      : trainedWeeks.reduce((sum, week) => sum + week.volume, 0) / trainedWeeks.length;
  const lastIndex = weeks.length - 1;

  return {
    sectionLabel: `VOLUME · ${weeks.length} WEEKS`,
    title: "Total training volume",
    averageLabel: "Average:",
    averageValue: formatKg(average),
    averageUnit: "kg/week",
    averagePosition: max > 0 ? (average / max) * (BAR_CEILING / 100) : 0,
    benchmarkTag: formatCompact(average),
    bars: weeks.map((week, index) => ({
      id: week.weekStart,
      weekLabel: formatShortDate(week.weekStart, timezone),
      volumeLabel: formatVolume(week.volume),
      heightPercent: max > 0 ? Math.round((week.volume / max) * BAR_CEILING) : 0,
      isCurrent: index === lastIndex,
      topTag: index === lastIndex && week.volume > 0 ? formatCompact(week.volume) : undefined,
    })),
    startLabel: weeks[0] ? formatShortDate(weeks[0].weekStart, timezone) : "",
    currentLabel: "This week",
  };
}

export function recentPrs(dashboard: Dashboard): RecentPr[] {
  return dashboard.recentPrs.slice(0, PR_LIMIT).map((pr) => ({
    id: pr.logId,
    exerciseName: pr.exerciseName,
    e1rmValue: `${formatKg(pr.e1rm)} kg`,
    relativeDate: formatRelative(pr.performedAt, dashboard.timezone),
    weight: pr.weight == null ? "—" : formatKg(pr.weight),
    repsUnit: pr.reps == null ? "kg" : `kg × ${formatCount(pr.reps)}`,
  }));
}
