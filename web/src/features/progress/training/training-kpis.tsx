import { SurfaceCard } from "@/components/ui/surface-card";
import type { Dashboard } from "@/contracts/analytics";
import { formatCount, formatKg } from "@/lib/format";
import styles from "../progress.module.css";

export const KPI_WEEKS = 8;

type Kpi = { label: string; value: string; unit: string };

function kpis(dashboard: Dashboard): Kpi[] {
  const sessions = dashboard.weeks.reduce((sum, week) => sum + week.sessions, 0);
  const volume = dashboard.weeks.reduce((sum, week) => sum + week.volume, 0);
  const streak = dashboard.currentStreakWeeks;

  return [
    { label: "Treinos", value: formatCount(sessions), unit: `em ${KPI_WEEKS} semanas` },
    // em toneladas: "101,8" cabe no cartão do celular, "101,8 mil kg" não
    { label: "Volume", value: formatKg(volume / 1000), unit: "toneladas levantadas" },
    { label: "Sequência", value: formatCount(streak), unit: streak === 1 ? "semana ativa" : "semanas ativas" },
  ];
}

/** Os três números do topo da aba Treino. */
export function TrainingKpis({ dashboard }: { dashboard: Dashboard }) {
  return (
    <div className={styles.kpis}>
      {kpis(dashboard).map((kpi) => (
        <SurfaceCard key={kpi.label} as="div" className={styles.kpi}>
          <span className={styles.kpiLabel}>{kpi.label}</span>
          <strong className={styles.kpiValue}>{kpi.value}</strong>
          <span className={styles.kpiUnit}>{kpi.unit}</span>
        </SurfaceCard>
      ))}
    </div>
  );
}
