import { CircleAlert, LoaderCircle } from "lucide-react";
import type { ImportJob } from "@/contracts/bioimpedance";
import styles from "./bioimpedance.module.css";

/** Texto curto do estado do job, usado na lista e no modal. */
export function processingLabel(job: ImportJob): string {
  return job.status === "PENDING" ? "Na fila para leitura…" : "Lendo os valores do laudo…";
}

type ImportProcessingProps = {
  job: ImportJob;
};

/** O motor está lendo o PDF. O usuário pode fechar: o job continua e fica na lista. */
export function ImportProcessing({ job }: ImportProcessingProps) {
  return (
    <div className={styles.statusPanel}>
      <LoaderCircle
        size={32}
        strokeWidth={1.75}
        className={`${styles.spinner} ${styles.statusIconProcessing}`}
        aria-hidden="true"
      />
      <p className={styles.statusFile}>{job.sourceFileName}</p>
      <p className={styles.statusTitle} role="status" aria-live="polite">
        {processingLabel(job)}
      </p>
      <p className={styles.statusText}>
        O motor de extração lê o PDF e separa cada valor. Costuma levar menos de um minuto.
      </p>
      <p className={styles.statusText}>
        Pode fechar esta janela: a importação continua e aparece na lista para você revisar.
      </p>
    </div>
  );
}

type ImportFailureProps = {
  job: ImportJob;
  onManualEntry: () => void;
};

/** O motor não conseguiu ler o PDF. Mostra o motivo técnico só sob demanda. */
export function ImportFailure({ job, onManualEntry }: ImportFailureProps) {
  return (
    <div className={styles.statusPanel} role="alert">
      <CircleAlert
        size={32}
        strokeWidth={1.75}
        className={styles.statusIconFailed}
        aria-hidden="true"
      />
      <p className={styles.statusFile}>{job.sourceFileName}</p>
      <p className={styles.statusTitle}>Não foi possível ler este laudo.</p>
      <p className={styles.statusText}>
        Confira se o PDF é um laudo de bioimpedância com texto (não uma foto escaneada) e envie de
        novo, ou digite os valores à mão.
      </p>
      <button type="button" className={styles.textButton} onClick={onManualEntry}>
        Preencher manualmente
      </button>
      {job.error ? (
        <details className={styles.technicalDetails}>
          <summary>Detalhes técnicos</summary>
          <code>{job.error}</code>
        </details>
      ) : null}
    </div>
  );
}
