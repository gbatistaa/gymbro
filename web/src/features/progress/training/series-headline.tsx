import type { ExerciseSeries } from "@/contracts/progress";
import { formatShortDate } from "@/lib/format";
import styles from "../progress.module.css";
import { formatSignedChange, type SeriesMetric } from "./series-metrics";

type SeriesHeadlineProps = {
  series: ExerciseSeries;
  metric: SeriesMetric;
  timeZone: string;
};

/** Valor do período mais recente e a variação desde o primeiro período com registro. */
export function SeriesHeadline({ series, metric, timeZone }: SeriesHeadlineProps) {
  const { points } = series;
  if (points.length === 0) {
    return <p className={styles.headlineEmpty}>Sem registros no período</p>;
  }

  const first = points[0];
  const last = points[points.length - 1];
  const change = metric.read(last) - metric.read(first);

  return (
    <div className={styles.headline}>
      <strong className={styles.headlineValue}>{metric.format(metric.read(last))}</strong>
      {points.length > 1 ? (
        <span className={styles.headlineChange}>
          {formatSignedChange(metric, change)} desde {formatShortDate(first.periodStart, timeZone)}
        </span>
      ) : (
        <span className={styles.headlineChange}>1 registro no período</span>
      )}
    </div>
  );
}
