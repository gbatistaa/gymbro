"use client";

import { BookOpen, Check, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PrimaryButton } from "@/components/ui/primary-button";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { TrainMockData } from "@/lib/mock-data";
import styles from "./train.module.css";

type TrainTopSectionProps = {
  data: TrainMockData;
};

export function TrainTopSection({ data }: TrainTopSectionProps) {
  const [filter, setFilter] = useState<"active" | "archived">("active");

  return (
    <>
      <div className={styles.topRow}>
        <div className={styles.titleGroup}>
          <h1 className={`${styles.screenTitle} text-text`}>{data.title}</h1>
          <p className={`${styles.screenSubtitle} tabular-nums text-muted`}>
            {data.subtitle}
          </p>
        </div>

        <PrimaryButton icon={<Plus size={16} strokeWidth={1.75} />}>
          {data.newRoutineLabel}
        </PrimaryButton>
      </div>

      <div className={styles.quickToolsGrid}>
        <Link
          href="/train/exercises"
          className={`${styles.libraryPill} bg-surface border-token radius-card`}
        >
          <span className={styles.libraryLeft}>
            <span className={`${styles.libraryIconBox} bg-surface-2 radius-btn`} aria-hidden="true">
              <BookOpen size={16} strokeWidth={1.75} />
            </span>
            <span className={`${styles.libraryName} text-text`}>{data.libraryLabel}</span>
          </span>

          <span className={`${styles.libraryCount} tabular-nums text-muted`}>
            {data.libraryCount}
          </span>
        </Link>

        <div
          className={`${styles.segmentedControl} bg-surface border-token radius-card`}
          role="group"
          aria-label="Filtrar rotinas por estado"
        >
          <button
            type="button"
            aria-pressed={filter === "active"}
            onClick={() => setFilter("active")}
            className={[
              styles.segmentButton,
              filter === "active"
                ? `${styles.segmentButtonActive} bg-surface-2 border-token text-text`
                : "text-muted",
            ].join(" ")}
          >
            {data.activeTabLabel}
          </button>

          <button
            type="button"
            aria-pressed={filter === "archived"}
            onClick={() => setFilter("archived")}
            className={[
              styles.segmentButton,
              "tabular-nums",
              filter === "archived"
                ? `${styles.segmentButtonActive} bg-surface-2 border-token text-text`
                : "text-muted",
            ].join(" ")}
          >
            {data.archivedTabLabel}
          </button>
        </div>
      </div>

      <SurfaceCard as="div" className={styles.adherenceBanner}>
        <div className={styles.adherenceLeft}>
          <span
            className={`${styles.adherenceIconBox} bg-surface-2 border-token text-primary radius-btn`}
            aria-hidden="true"
          >
            <Check size={16} strokeWidth={1.75} />
          </span>

          <div className={styles.adherenceTextGroup}>
            <p className={`${styles.adherenceTitle} tabular-nums text-text`}>
              {data.adherenceBanner.title}
            </p>
            <p className={`${styles.adherenceSubtitle} tabular-nums text-muted`}>
              {data.adherenceBanner.subtitle}
            </p>
          </div>
        </div>

        <div className={`${styles.adherenceRight} tabular-nums`}>
          <span className={`${styles.adherenceRatio} text-text`}>
            {data.adherenceBanner.value}
          </span>
          <span className={`${styles.adherenceUnit} text-muted`}>
            {data.adherenceBanner.unit}
          </span>
        </div>
      </SurfaceCard>
    </>
  );
}

type QuickSearchBarProps = {
  placeholder: string;
  shortcut: string;
};

export function QuickSearchBar({ placeholder, shortcut }: QuickSearchBarProps) {
  return (
    <label className={`${styles.searchBar} bg-surface border-token radius-card`}>
      <span className={styles.searchLeft}>
        <span className={`${styles.searchIcon} text-muted`} aria-hidden="true">
          <Search size={16} strokeWidth={1.75} />
        </span>
        <input
          type="search"
          className={`${styles.searchInput} text-text`}
          placeholder={placeholder}
          aria-label="Buscar exercício ou carga rápida"
        />
      </span>
      <span className={`${styles.shortcutTag} text-muted`} aria-hidden="true">
        {shortcut}
      </span>
    </label>
  );
}
