import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Bioimpedance } from "@/contracts/bioimpedance";
import { formatDate, formatTime } from "@/lib/format";
import { formatDelta, formatMetric, isManual, originBadge, type MetricKey } from "./metrics";
import styles from "./bioimpedance.module.css";

/** As três métricas do resumo, na ordem da linha. */
const SUMMARY: readonly { key: MetricKey; label: string; unit: "kg" | "%" }[] = [
  { key: "bodyWeightKg", label: "Peso", unit: "kg" },
  { key: "bodyFatPercentage", label: "Gordura", unit: "%" },
  { key: "muscleMassKg", label: "Massa musc.", unit: "kg" },
];

function deltaOf(
  key: MetricKey,
  current: Bioimpedance,
  previous: Bioimpedance | undefined,
): number | null {
  const now = current[key];
  const before = previous?.[key];
  return now == null || before == null ? null : now - before;
}

type MeasurementListProps = {
  /** Da mais recente para a mais antiga. */
  measurements: Bioimpedance[];
  timeZone: string;
  onOpen: (measurement: Bioimpedance) => void;
};

export function MeasurementList({ measurements, timeZone, onOpen }: MeasurementListProps) {
  return (
    <ul className={styles.measurementList}>
      {measurements.map((measurement, index) => (
        <li key={measurement.id}>
          <MeasurementItem
            measurement={measurement}
            previous={measurements[index + 1]}
            timeZone={timeZone}
            onOpen={onOpen}
          />
        </li>
      ))}
    </ul>
  );
}

type MeasurementItemProps = {
  measurement: Bioimpedance;
  /** Medição anterior, para a variação de cada métrica. */
  previous: Bioimpedance | undefined;
  timeZone: string;
  onOpen: (measurement: Bioimpedance) => void;
};

function MeasurementItem({ measurement, previous, timeZone, onOpen }: MeasurementItemProps) {
  return (
    <button
      type="button"
      className={styles.measurementCard}
      aria-haspopup="dialog"
      onClick={() => onOpen(measurement)}
    >
      <span className={styles.measurementHead}>
        <span className={styles.measurementWhen}>
          <span className={styles.measurementDate}>
            {formatDate(measurement.measuredAt, timeZone)}
          </span>
          <span className={`${styles.measurementTime} tabular-nums`}>
            {formatTime(measurement.measuredAt, timeZone)}
          </span>
        </span>
        <Badge tone={isManual(measurement) ? "neutral" : "info"}>{originBadge(measurement)}</Badge>
        <ChevronRight size={18} strokeWidth={1.75} className={styles.chevron} aria-hidden="true" />
      </span>

      <span className={styles.summaryGrid}>
        {SUMMARY.map(({ key, label, unit }) => {
          const delta = deltaOf(key, measurement, previous);

          return (
            <span key={key} className={styles.summaryCell}>
              <span className={styles.summaryLabel}>{label}</span>
              <span className={`${styles.summaryValue} tabular-nums`}>
                {formatMetric(unit, measurement[key])}
              </span>
              <span className={`${styles.summaryDelta} tabular-nums`}>
                {delta === null ? null : (
                  <>
                    <span className={styles.srOnly}>Desde a medição anterior: </span>
                    {formatDelta(unit, delta)}
                  </>
                )}
              </span>
            </span>
          );
        })}
      </span>
    </button>
  );
}
