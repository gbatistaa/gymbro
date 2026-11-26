"use client";

import { FileText, PenLine } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataRow } from "@/components/ui/data-row";
import { Modal } from "@/components/ui/modal";
import { SectionLabel } from "@/components/ui/section-label";
import type { Bioimpedance } from "@/contracts/bioimpedance";
import { formatDate, formatDateTime, formatKg, formatTime } from "@/lib/format";
import {
  bodyMassIndex,
  formatMetric,
  isManual,
  METRICS,
  originBadge,
  originDescription,
} from "./metrics";
import styles from "./bioimpedance.module.css";

/** O backend grava `updatedAt` junto com `createdAt`; só é edição se passou mais de um segundo. */
function wasEdited(measurement: Bioimpedance): boolean {
  if (!measurement.updatedAt) return false;
  return Date.parse(measurement.updatedAt) - Date.parse(measurement.createdAt) > 1_000;
}

type MeasurementDetailModalProps = {
  measurement: Bioimpedance;
  timeZone: string;
  onDelete: () => void;
  onClose: () => void;
};

export function MeasurementDetailModal({
  measurement,
  timeZone,
  onDelete,
  onClose,
}: MeasurementDetailModalProps) {
  const manual = isManual(measurement);
  const bmi = bodyMassIndex(measurement);

  return (
    <Modal
      title={`Medição de ${formatDate(measurement.measuredAt, timeZone)}`}
      description={`Medida às ${formatTime(measurement.measuredAt, timeZone)}`}
      size="large"
      onClose={onClose}
      footer={
        <>
          <Button variant="danger" onClick={onDelete}>
            Excluir medição
          </Button>
          <Button variant="secondary" onClick={onClose} autoFocus>
            Fechar
          </Button>
        </>
      }
    >
      <div className={styles.origin}>
        <span className={styles.originIcon} aria-hidden="true">
          {manual ? <PenLine size={18} strokeWidth={1.75} /> : <FileText size={18} strokeWidth={1.75} />}
        </span>
        <div className={styles.originText}>
          <span className={styles.originTitle}>
            {originDescription(measurement)}
            <Badge tone={manual ? "neutral" : "info"}>{originBadge(measurement)}</Badge>
          </span>
          {measurement.sourceFileName ? (
            <span className={styles.originFile}>{measurement.sourceFileName}</span>
          ) : null}
        </div>
      </div>

      <section className={styles.detailSection} aria-label="Composição corporal">
        <SectionLabel as="h3">Composição corporal</SectionLabel>
        <div className={styles.detailRows}>
          {METRICS.map((metric) => (
            <DataRow
              key={metric.key}
              label={metric.label}
              value={formatMetric(metric.unit, measurement[metric.key])}
            />
          ))}
          <DataRow
            label="IMC"
            annotation="calculado"
            value={bmi === null ? "—" : formatKg(bmi)}
          />
        </div>
      </section>

      <section className={styles.detailSection} aria-label="Registro">
        <SectionLabel as="h3">Registro</SectionLabel>
        <dl className={styles.recordList}>
          <div className={styles.recordRow}>
            <dt>Origem</dt>
            <dd>{manual ? "Adição manual" : "Arquivo de bioimpedância"}</dd>
          </div>
          {measurement.sourceFileName ? (
            <div className={styles.recordRow}>
              <dt>Arquivo</dt>
              <dd className={styles.recordFile}>{measurement.sourceFileName}</dd>
            </div>
          ) : null}
          <div className={styles.recordRow}>
            <dt>Data da medição</dt>
            <dd className="tabular-nums">{formatDateTime(measurement.measuredAt, timeZone)}</dd>
          </div>
          <div className={styles.recordRow}>
            <dt>Registrada em</dt>
            <dd className="tabular-nums">{formatDateTime(measurement.createdAt, timeZone)}</dd>
          </div>
          {measurement.updatedAt && wasEdited(measurement) ? (
            <div className={styles.recordRow}>
              <dt>Última alteração</dt>
              <dd className="tabular-nums">{formatDateTime(measurement.updatedAt, timeZone)}</dd>
            </div>
          ) : null}
          {measurement.sourceFileHash ? (
            <div className={styles.recordRow}>
              <dt>Impressão do arquivo</dt>
              <dd className={styles.recordHash} title={measurement.sourceFileHash}>
                SHA-256 {measurement.sourceFileHash.slice(0, 12)}…
              </dd>
            </div>
          ) : null}
        </dl>
      </section>
    </Modal>
  );
}
