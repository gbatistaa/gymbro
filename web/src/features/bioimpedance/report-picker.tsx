"use client";

import { FileText, FileUp } from "lucide-react";
import { useId, useState, type ChangeEvent, type DragEvent } from "react";
import { reportFileSchema } from "@/contracts/bioimpedance";
import { notifyValidation } from "@/lib/notify";
import styles from "./bioimpedance.module.css";

const sizeFormat = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${sizeFormat.format(bytes / 1024)} KB`;
  return `${sizeFormat.format(bytes / (1024 * 1024))} MB`;
}

type ReportPickerProps = {
  file: File | null;
  /** Fração enviada, de 0 a 1, enquanto o upload acontece; `null` antes de enviar. */
  uploadProgress: number | null;
  onChange: (file: File | null) => void;
};

/** Escolha do laudo em PDF: toque para abrir o seletor do aparelho ou solte o arquivo na área. */
export function ReportPicker({ file, uploadProgress, onChange }: ReportPickerProps) {
  const inputId = useId();
  const errorId = useId();
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const isUploading = uploadProgress !== null;

  function choose(candidate: File | undefined) {
    if (!candidate) return;

    const parsed = reportFileSchema.safeParse(candidate);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Escolha um arquivo PDF.");
      notifyValidation(parsed.error);
      onChange(null);
      return;
    }

    setError(null);
    onChange(parsed.data);
  }

  function handleInput(event: ChangeEvent<HTMLInputElement>) {
    choose(event.target.files?.[0]);
    // permite escolher o mesmo arquivo de novo depois de trocar
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (!isUploading) choose(event.dataTransfer.files[0]);
  }

  function handleDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    if (!isUploading) setIsDragging(true);
  }

  return (
    <div className={styles.picker}>
      <input
        id={inputId}
        type="file"
        accept="application/pdf,.pdf"
        className={styles.fileInput}
        disabled={isUploading}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={handleInput}
      />
      <label
        htmlFor={inputId}
        className={[
          styles.dropzone,
          isDragging ? styles.dropzoneActive : null,
          isUploading ? styles.dropzoneDisabled : null,
        ]
          .filter(Boolean)
          .join(" ")}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <FileUp size={24} strokeWidth={1.75} aria-hidden="true" />
        <span className={styles.dropzoneTitle}>
          {file ? "Trocar arquivo" : "Escolher laudo em PDF"}
        </span>
        <span className={styles.dropzoneHint}>PDF de até 10 MB</span>
      </label>

      {error ? (
        <p id={errorId} className={styles.pickerError} role="alert">
          {error}
        </p>
      ) : null}

      {file ? (
        <div className={styles.selectedFile}>
          <FileText size={18} strokeWidth={1.75} aria-hidden="true" />
          <span className={styles.selectedFileName}>{file.name}</span>
          <span className={`${styles.selectedFileSize} tabular-nums`}>{formatFileSize(file.size)}</span>
        </div>
      ) : null}

      {isUploading ? (
        <div className={styles.upload} role="status" aria-live="polite">
          <div className={styles.uploadTrack} aria-hidden="true">
            <div
              className={styles.uploadFill}
              style={{ width: `${Math.round(uploadProgress * 100)}%` }}
            />
          </div>
          <span className={`${styles.uploadText} tabular-nums`}>
            Enviando arquivo… {Math.round(uploadProgress * 100)}%
          </span>
        </div>
      ) : null}
    </div>
  );
}
