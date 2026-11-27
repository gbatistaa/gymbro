import { LineChart } from "@/components/charts/line-chart";
import type { ExerciseSeries } from "@/contracts/progress";
import type { TimeRange } from "@/lib/date-ranges";
import { formatAxisDate, formatPeriod } from "../period-labels";
import type { SeriesMetric } from "./series-metrics";

type SeriesChartProps = {
  series: ExerciseSeries;
  metric: SeriesMetric;
  range: TimeRange;
  timeZone: string;
  height?: number;
};

/** A série de um exercício numa métrica, ocupando o período pedido inteiro no eixo X. */
export function SeriesChart({ series, metric, range, timeZone, height }: SeriesChartProps) {
  const data = series.points.map((point) => ({
    x: Date.parse(point.periodStart),
    y: metric.read(point),
  }));

  return (
    <LineChart
      data={data}
      label={`${metric.label} de ${series.name}`}
      // `to` é exclusivo: o eixo termina no último dia do período, não no seguinte
      xDomain={[Date.parse(range.from), Date.parse(range.to) - 1]}
      formatValue={metric.format}
      formatTick={metric.formatTick}
      formatDate={(x) => formatPeriod(x, series.bucket, timeZone)}
      formatAxisDate={(x) => formatAxisDate(x, timeZone)}
      height={height}
    />
  );
}
