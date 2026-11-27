"use client";

import { FileUp, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Notice } from "@/components/ui/notice";
import { SectionLabel } from "@/components/ui/section-label";
import { Skeleton } from "@/components/ui/skeleton";
import type { Bioimpedance, ImportJob } from "@/contracts/bioimpedance";
import { formatCount, formatDate, formatRelative } from "@/lib/format";
import { notifyApiError, notifySuccess } from "@/lib/notify";
import { useResource } from "@/lib/use-resource";
import { useUserTimeZone } from "@/lib/use-user-time-zone";
import { deleteMeasurement, listMeasurements } from "./api";
import { ImportJobList } from "./import-job-list";
import { ImportModal } from "./import-modal";
import { ManualEntryModal } from "./manual-entry-modal";
import { MeasurementDetailModal } from "./measurement-detail-modal";
import { MeasurementList } from "./measurement-list";
import { useImportJobs } from "./use-import-jobs";
import styles from "./bioimpedance.module.css";

/** Modal de importação aberto; `jobId` nulo enquanto o usuário escolhe o arquivo. */
type ImportDialog = { jobId: string | null };

function subtitle(measurements: Bioimpedance[] | null, timeZone: string): string {
  if (!measurements) return "Sua composição corporal ao longo do tempo";
  const latest = measurements[0];
  if (!latest) return "Nenhuma medição registrada";

  const count = `${formatCount(measurements.length)} ${measurements.length === 1 ? "medição" : "medições"}`;
  return `${count} · última ${formatRelative(latest.measuredAt, timeZone)}`;
}

export function BioimpedanceScreen() {
  const timeZone = useUserTimeZone();

  const measurements = useResource("bioimpedance:measurements", listMeasurements);
  const imports = useImportJobs();

  const [isAddingManual, setIsAddingManual] = useState(false);
  const [importDialog, setImportDialog] = useState<ImportDialog | null>(null);
  const [selected, setSelected] = useState<Bioimpedance | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const followedJob =
    importDialog?.jobId != null
      ? (imports.jobs?.find((job) => job.id === importDialog.jobId) ?? null)
      : null;

  function handleManualCreated(measurement: Bioimpedance) {
    setIsAddingManual(false);
    notifySuccess(`Medição de ${formatDate(measurement.measuredAt, timeZone)} salva.`);
    measurements.reload();
  }

  function handleUploaded(job: ImportJob) {
    imports.add(job);
    // se o usuário fechou o modal durante o envio, ele não reabre sozinho
    setImportDialog((current) => (current ? { jobId: job.id } : null));
  }

  function handleImportSaved(jobId: string) {
    imports.remove(jobId);
    setImportDialog(null);
    notifySuccess("Medição do laudo salva no histórico.");
    measurements.reload();
    imports.reload();
  }

  function handleImportDiscarded(jobId: string) {
    imports.remove(jobId);
    notifySuccess("Importação descartada.");
  }

  function openManualFromImport() {
    setImportDialog(null);
    setIsAddingManual(true);
  }

  function closeDetail() {
    setSelected(null);
    setIsConfirmingDelete(false);
  }

  async function deleteSelected() {
    if (!selected || isDeleting) return;
    setIsDeleting(true);

    try {
      await deleteMeasurement(selected.id);
      notifySuccess(`Medição de ${formatDate(selected.measuredAt, timeZone)} excluída.`);
      closeDetail();
      measurements.reload();
    } catch (failure) {
      setIsConfirmingDelete(false);
      notifyApiError(failure);
    } finally {
      setIsDeleting(false);
    }
  }

  const openImports = imports.jobs ?? [];

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <span className={styles.kicker}>Composição corporal</span>
          <h1 className={styles.title}>Bioimpedância</h1>
          <p className={`${styles.subtitle} tabular-nums`}>
            {subtitle(measurements.data, timeZone)}
          </p>
        </div>

        <div className={styles.headerActions}>
          <Button variant="secondary" onClick={() => setImportDialog({ jobId: null })}>
            <FileUp size={16} strokeWidth={2} aria-hidden="true" />
            Importar PDF
          </Button>
          <Button onClick={() => setIsAddingManual(true)}>
            <Plus size={16} strokeWidth={2} aria-hidden="true" />
            Nova medição
          </Button>
        </div>
      </header>

      {imports.error && openImports.length === 0 ? (
        <div className={styles.importsError}>
          <Notice>Não foi possível carregar suas importações: {imports.error}</Notice>
          <Button variant="ghost" size="sm" onClick={imports.reload}>
            Tentar novamente
          </Button>
        </div>
      ) : null}

      {openImports.length > 0 ? (
        <section className={styles.section} aria-labelledby="bio-imports-title">
          <SectionLabel>
            <span id="bio-imports-title">Importações · {formatCount(openImports.length)}</span>
          </SectionLabel>
          <ImportJobList
            jobs={openImports}
            onOpen={(job) => setImportDialog({ jobId: job.id })}
          />
        </section>
      ) : null}

      <section className={styles.section} aria-labelledby="bio-history-title">
        <SectionLabel>
          <span id="bio-history-title">Histórico de medições</span>
        </SectionLabel>

        {measurements.isLoading ? (
          <Skeleton lines={3} label="Carregando medições…" />
        ) : measurements.error || !measurements.data ? (
          <ErrorState
            message={measurements.error ?? "Não foi possível carregar suas medições."}
            onRetry={measurements.reload}
          />
        ) : measurements.data.length === 0 ? (
          <EmptyState
            title="Nenhuma medição ainda"
            description="Importe o PDF do seu laudo de bioimpedância ou digite os valores manualmente."
            action={
              <div className={styles.emptyActions}>
                <Button variant="secondary" onClick={() => setImportDialog({ jobId: null })}>
                  Importar PDF
                </Button>
                <Button onClick={() => setIsAddingManual(true)}>Nova medição</Button>
              </div>
            }
          />
        ) : (
          <>
            <p className={styles.listCaption}>
              Toque em uma medição para ver todos os valores. A variação compara com a medição
              anterior.
            </p>
            <MeasurementList
              measurements={measurements.data}
              timeZone={timeZone}
              onOpen={setSelected}
            />
          </>
        )}
      </section>

      {isAddingManual ? (
        <ManualEntryModal
          timeZone={timeZone}
          onCreated={handleManualCreated}
          onClose={() => setIsAddingManual(false)}
        />
      ) : null}

      {importDialog ? (
        <ImportModal
          job={followedJob}
          timeZone={timeZone}
          onUploaded={handleUploaded}
          onSaved={handleImportSaved}
          onDiscarded={handleImportDiscarded}
          onRestart={() => setImportDialog({ jobId: null })}
          onManualEntry={openManualFromImport}
          onClose={() => setImportDialog(null)}
        />
      ) : null}

      {selected ? (
        <MeasurementDetailModal
          measurement={selected}
          timeZone={timeZone}
          onDelete={() => setIsConfirmingDelete(true)}
          onClose={closeDetail}
        />
      ) : null}

      {selected && isConfirmingDelete ? (
        <ConfirmDialog
          title="Excluir esta medição?"
          description={`A medição de ${formatDate(selected.measuredAt, timeZone)} sai do seu histórico e das tendências de composição corporal.`}
          confirmLabel="Excluir"
          isConfirming={isDeleting}
          onConfirm={deleteSelected}
          onCancel={() => setIsConfirmingDelete(false)}
        />
      ) : null}
    </div>
  );
}
