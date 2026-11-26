import { ChevronRight, CircleAlert, FileCheck, LoaderCircle } from "lucide-react";
import type { ImportJob } from "@/contracts/bioimpedance";
import { processingLabel } from "./import-status";
import { isProcessing } from "./use-import-jobs";
import styles from "./bioimpedance.module.css";

function statusText(job: ImportJob): string {
  if (isProcessing(job)) return processingLabel(job);
  return job.status === "DONE" ? "Pronto para revisar" : "Falha na leitura · toque para ver";
}

function StatusIcon({ job }: { job: ImportJob }) {
  if (isProcessing(job)) {
    return (
      <LoaderCircle
        size={20}
        strokeWidth={1.75}
        className={`${styles.spinner} ${styles.statusIconProcessing}`}
        aria-hidden="true"
      />
    );
  }
  if (job.status === "DONE") {
    return <FileCheck size={20} strokeWidth={1.75} className={styles.statusIconDone} aria-hidden="true" />;
  }
  return <CircleAlert size={20} strokeWidth={1.75} className={styles.statusIconFailed} aria-hidden="true" />;
}

type ImportJobListProps = {
  jobs: ImportJob[];
  onOpen: (job: ImportJob) => void;
};

/** Laudos enviados que ainda não viraram medição: lendo, prontos para revisar ou com falha. */
export function ImportJobList({ jobs, onOpen }: ImportJobListProps) {
  return (
    <ul className={styles.jobList} aria-live="polite">
      {jobs.map((job) => (
        <li key={job.id}>
          <button
            type="button"
            className={styles.jobRow}
            aria-haspopup="dialog"
            onClick={() => onOpen(job)}
          >
            <StatusIcon job={job} />
            <span className={styles.jobInfo}>
              <span className={styles.jobName}>{job.sourceFileName}</span>
              <span
                className={[
                  styles.jobStatus,
                  job.status === "DONE" ? styles.jobStatusDone : null,
                  job.status === "FAILED" ? styles.jobStatusFailed : null,
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {statusText(job)}
              </span>
            </span>
            {job.status === "DONE" ? <span className={styles.jobAction}>Revisar</span> : null}
            <ChevronRight size={18} strokeWidth={1.75} className={styles.chevron} aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  );
}
