import type { Dashboard } from "@/contracts/analytics";
import { formatCount, formatDate, formatVolume } from "@/lib/format";
import styles from "./home.module.css";

type WeeklyBarsProps = {
  weeks: Dashboard["weeks"];
  timezone: string;
};

export function WeeklyBars({ weeks, timezone }: WeeklyBarsProps) {
  const max = Math.max(...weeks.map((week) => week.volume), 1);

  return (
    <ul className={styles.bars} aria-label="Volume das últimas 12 semanas">
      {weeks.map((week, index) => (
        <li key={week.weekStart} className={styles.barItem}>
          <span
            className={[
              styles.bar,
              index === weeks.length - 1 ? styles.barCurrent : null,
            ]
              .filter(Boolean)
              .join(" ")}
            style={{ height: `${Math.max(2, Math.round((week.volume / max) * 100))}%` }}
            aria-hidden="true"
          />
          <span className={styles.srOnly}>
            Semana de {formatDate(week.weekStart, timezone)}:{" "}
            {formatVolume(week.volume)}, {formatCount(week.sessions)} sessões
          </span>
        </li>
      ))}
    </ul>
  );
}
