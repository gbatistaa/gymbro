"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { BioimpedancePayload, ImportJob } from "@/contracts/bioimpedance";
import { apiErrorCode } from "@/lib/api-error-text";
import { notifyApiError } from "@/lib/notify";
import { confirmImport, discardImport, uploadReport } from "./api";
import { ImportFailure, ImportProcessing } from "./import-status";
import { ImportReview } from "./import-review";
import { notifyBioimpedanceError } from "./notify-bioimpedance-error";
import { ReportPicker } from "./report-picker";
import { isProcessing } from "./use-import-jobs";

const REVIEW_FORM_ID = "import-review-form";

type Stage = "pick" | "processing" | "review" | "failed";

function stageOf(job: ImportJob | null): Stage {
  if (job === null) return "pick";
  if (isProcessing(job)) return "processing";
  return job.status === "DONE" ? "review" : "failed";
}

const TITLES: Record<Stage, { title: string; description?: string }> = {
  pick: {
    title: "Importar laudo",
    description:
      "Envie o PDF do seu exame de bioimpedância. Os valores são lidos automaticamente e você revisa antes de salvar.",
  },
  processing: { title: "Lendo o laudo" },
  review: {
    title: "Revisar valores do laudo",
    description: "Confira e corrija o que foi lido. Nada é salvo antes da sua confirmação.",
  },
  failed: { title: "Falha na leitura" },
};

type ImportModalProps = {
  /** Job acompanhado; `null` enquanto o usuário escolhe o arquivo. */
  job: ImportJob | null;
  timeZone: string;
  onUploaded: (job: ImportJob) => void;
  /** A medição foi criada a partir deste job (agora ou em outra aba). */
  onSaved: (jobId: string) => void;
  onDiscarded: (jobId: string) => void;
  /** Volta para a escolha de arquivo. */
  onRestart: () => void;
  onManualEntry: () => void;
  onClose: () => void;
};

export function ImportModal({
  job,
  timeZone,
  onUploaded,
  onSaved,
  onDiscarded,
  onRestart,
  onManualEntry,
  onClose,
}: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);

  const stage = stageOf(job);
  const isUploading = uploadProgress !== null;

  async function upload() {
    if (!file || isUploading) return;
    setUploadProgress(0);

    try {
      const uploaded = await uploadReport(file, setUploadProgress);
      setFile(null);
      onUploaded(uploaded);
    } catch (failure) {
      notifyBioimpedanceError(failure);
    } finally {
      setUploadProgress(null);
    }
  }

  async function save(payload: BioimpedancePayload) {
    if (!job || isSaving) return;
    setIsSaving(true);

    try {
      await confirmImport(job.id, payload);
      onSaved(job.id);
    } catch (failure) {
      notifyBioimpedanceError(failure);
      setIsSaving(false);
      if (apiErrorCode(failure) === "BIOIMPEDANCE_IMPORT_ALREADY_CONFIRMED") onSaved(job.id);
    }
  }

  /** Remove o job no backend; `then` decide se fecha o modal ou volta para a escolha. */
  async function discard(then: () => void) {
    if (!job || isDiscarding) return;
    setIsDiscarding(true);

    try {
      await discardImport(job.id);
      onDiscarded(job.id);
      then();
    } catch (failure) {
      notifyApiError(failure);
    } finally {
      setIsDiscarding(false);
    }
  }

  let body: ReactNode;
  let footer: ReactNode;

  if (stage === "pick") {
    body = <ReportPicker file={file} uploadProgress={uploadProgress} onChange={setFile} />;
    footer = (
      <>
        <Button variant="secondary" onClick={onClose} disabled={isUploading}>
          Cancelar
        </Button>
        <Button
          onClick={upload}
          disabled={!file}
          isLoading={isUploading}
          loadingLabel="Enviando laudo…"
        >
          Enviar e ler
        </Button>
      </>
    );
  } else if (job && stage === "processing") {
    body = <ImportProcessing job={job} />;
    footer = (
      <>
        <Button variant="ghost" onClick={() => discard(onClose)} isLoading={isDiscarding}>
          Cancelar importação
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Fechar
        </Button>
      </>
    );
  } else if (job && stage === "review") {
    body = (
      <ImportReview
        key={job.id}
        formId={REVIEW_FORM_ID}
        job={job}
        timeZone={timeZone}
        isSaving={isSaving}
        onSubmit={save}
      />
    );
    footer = (
      <>
        <Button
          variant="ghost"
          onClick={() => discard(onClose)}
          disabled={isSaving}
          isLoading={isDiscarding}
        >
          Descartar
        </Button>
        <Button
          type="submit"
          form={REVIEW_FORM_ID}
          disabled={isDiscarding}
          isLoading={isSaving}
          loadingLabel="Salvando medição…"
        >
          Salvar medição
        </Button>
      </>
    );
  } else if (job) {
    body = <ImportFailure job={job} onManualEntry={onManualEntry} />;
    footer = (
      <>
        <Button variant="secondary" onClick={() => discard(onClose)} isLoading={isDiscarding}>
          Descartar
        </Button>
        <Button onClick={() => discard(onRestart)} disabled={isDiscarding}>
          Enviar outro PDF
        </Button>
      </>
    );
  }

  return (
    <Modal
      title={TITLES[stage].title}
      description={TITLES[stage].description}
      size="large"
      onClose={onClose}
      footer={footer}
    >
      {body}
    </Modal>
  );
}
