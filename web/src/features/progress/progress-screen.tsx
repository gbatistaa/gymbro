"use client";

import { useState } from "react";
import { SegmentedControl, type SegmentedOption } from "@/components/ui/segmented-control";
import { BioProgress } from "./bio/bio-progress";
import styles from "./progress.module.css";
import { TrainingProgress } from "./training/training-progress";

type ProgressTab = "training" | "bio";

const TABS: readonly SegmentedOption<ProgressTab>[] = [
  { value: "training", label: "Treino" },
  { value: "bio", label: "Bioimpedância" },
];

/** Painel de evolução, com uma aba para os treinos e outra para a composição corporal. */
export function ProgressScreen() {
  const [tab, setTab] = useState<ProgressTab>("training");

  return (
    <div className={styles.screen}>
      <header className={styles.pageHeader}>
        <span className={styles.pageKicker}>Painel de evolução</span>
        <h1 className={styles.title}>Progresso</h1>
      </header>

      <SegmentedControl legend="Painel" options={TABS} value={tab} onChange={setTab} />

      {tab === "training" ? <TrainingProgress /> : <BioProgress />}
    </div>
  );
}
