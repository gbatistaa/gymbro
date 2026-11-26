"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { Bioimpedance, BioimpedancePayload } from "@/contracts/bioimpedance";
import { createMeasurement } from "./api";
import { emptyFormValues } from "./form-values";
import { MeasurementForm } from "./measurement-form";
import { notifyBioimpedanceError } from "./notify-bioimpedance-error";

const FORM_ID = "manual-measurement-form";

type ManualEntryModalProps = {
  timeZone: string;
  onCreated: (measurement: Bioimpedance) => void;
  onClose: () => void;
};

export function ManualEntryModal({ timeZone, onCreated, onClose }: ManualEntryModalProps) {
  const [initialValues] = useState(() => emptyFormValues(timeZone));
  const [isSaving, setIsSaving] = useState(false);

  async function save(payload: BioimpedancePayload) {
    if (isSaving) return;
    setIsSaving(true);

    try {
      onCreated(await createMeasurement(payload));
    } catch (failure) {
      notifyBioimpedanceError(failure);
      setIsSaving(false);
    }
  }

  return (
    <Modal
      title="Nova medição"
      description="Digite os valores do seu laudo de bioimpedância. Gordura corporal e massa muscular são obrigatórias."
      size="large"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="submit" form={FORM_ID} isLoading={isSaving} loadingLabel="Salvando medição…">
            Salvar medição
          </Button>
        </>
      }
    >
      <MeasurementForm
        formId={FORM_ID}
        timeZone={timeZone}
        initialValues={initialValues}
        isDisabled={isSaving}
        onSubmit={save}
      />
    </Modal>
  );
}
