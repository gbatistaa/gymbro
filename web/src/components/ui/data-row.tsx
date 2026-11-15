import type { ReactNode } from "react";
import styles from "./ui.module.css";

type DataRowProps = {
  label: ReactNode;
  /** Valor tabular, alinhado à direita. Já formatado com `lib/format.ts`. */
  value: ReactNode;
  /** Anotação curta na gutter: `+2,5 kg`, `RPE 8`, `há 6 d`. */
  annotation?: ReactNode;
};

export function DataRow({ label, value, annotation }: DataRowProps) {
  return (
    <div
      className={[styles.dataRow, annotation ? styles.dataRowWithAnnotation : null]
        .filter(Boolean)
        .join(" ")}
    >
      <span className={styles.dataRowLabel}>{label}</span>
      {annotation ? (
        <span className={styles.dataRowAnnotation}>{annotation}</span>
      ) : null}
      <span className={styles.dataRowValue}>{value}</span>
    </div>
  );
}
