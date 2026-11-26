"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Sparkles, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { NextTarget } from "@/contracts/analytics";
import type { PlaylistExercise } from "@/contracts/playlist";
import { formatCount, formatKg } from "@/lib/format";
import styles from "./train.module.css";

function formatRepsRange(item: PlaylistExercise): string {
  if (item.targetRepsMin != null && item.targetRepsMax != null) {
    return item.targetRepsMin === item.targetRepsMax
      ? `${item.targetRepsMin}`
      : `${item.targetRepsMin}–${item.targetRepsMax}`;
  }
  return "—";
}

function formatLoad(
  weight: number | null | undefined,
  reps: number | null | undefined,
): string | null {
  if (weight == null && reps == null) return null;
  if (weight == null) return `${formatCount(reps)} reps`;
  if (reps == null) return `${formatKg(weight)} kg`;
  return `${formatKg(weight)} kg × ${formatCount(reps)}`;
}

type PlaylistItemCardProps = {
  item: PlaylistExercise;
  position: number;
  isArchived: boolean;
  target: NextTarget | undefined;
  /** Enquanto uma ação em andamento mexe na ficha, o card não pode ser movido nem removido. */
  isLocked: boolean;
  onEdit: (item: PlaylistExercise) => void;
  onRemove: (item: PlaylistExercise) => void;
};

export function PlaylistItemCard({
  item,
  position,
  isArchived,
  target,
  isLocked,
  onEdit,
  onRemove,
}: PlaylistItemCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: isLocked });

  const lastLoad = target ? formatLoad(target.lastWeight, target.lastReps) : null;
  const suggestedLoad = target
    ? formatLoad(target.suggestedWeight, target.suggestedReps)
    : null;

  return (
    <li
      ref={setNodeRef}
      className={`${styles.itemSortable} ${isDragging ? styles.itemDragging : ""}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...(isLocked ? {} : listeners)}
    >
      <SurfaceCard
        as="article"
        className={`${styles.itemCard} ${isDragging ? styles.itemCardDragging : ""}`}
      >
        <div className={styles.itemTop}>
          <Button
            ref={setActivatorNodeRef}
            variant="ghost"
            size="icon"
            className={styles.dragHandle}
            aria-label={`Reordenar ${item.exerciseName}`}
            disabled={isLocked}
            {...attributes}
          >
            <GripVertical size={18} aria-hidden="true" />
          </Button>

          <div className={styles.itemInfo}>
            <div className={styles.itemTitleRow}>
              <span className={styles.itemOrderBadge}>
                {String(position).padStart(2, "0")}
              </span>
              <h3 className={styles.itemName}>{item.exerciseName}</h3>
              {isArchived ? <Badge tone="neutral">Arquivado</Badge> : null}
            </div>
            {item.primaryMuscle ? (
              <span className={styles.itemMuscle}>{item.primaryMuscle}</span>
            ) : null}
          </div>

          <div className={styles.itemActions}>
            <Button
              variant="secondary"
              size="icon"
              aria-label={`Editar alvos de ${item.exerciseName}`}
              onClick={() => onEdit(item)}
            >
              <Pencil size={16} aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Remover ${item.exerciseName}`}
              disabled={isLocked}
              onClick={() => onRemove(item)}
            >
              <Trash2 size={16} aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div className={styles.itemMetricsGrid}>
          <div className={styles.itemMetricCell}>
            <span className={styles.itemMetricLabel}>Carga-alvo</span>
            <strong className={styles.itemMetricValue}>
              {item.targetWeightKg != null && item.targetWeightKg > 0
                ? `${formatKg(item.targetWeightKg)} kg`
                : "—"}
            </strong>
          </div>
          <div className={styles.itemMetricCell}>
            <span className={styles.itemMetricLabel}>Séries × Reps</span>
            <strong className={styles.itemMetricValue}>
              {item.targetSets != null ? formatCount(item.targetSets) : "—"} ×{" "}
              {formatRepsRange(item)}
            </strong>
          </div>
          <div className={styles.itemMetricCell}>
            <span className={styles.itemMetricLabel}>Descanso</span>
            <strong className={styles.itemMetricValue}>
              {item.restSeconds != null ? `${formatCount(item.restSeconds)} s` : "—"}
            </strong>
          </div>
        </div>

        <div className={styles.itemProgressionBar}>
          <div className={styles.itemProgressionItem}>
            <span className={styles.itemProgressionLabel}>Última carga:</span>
            <span className={styles.itemProgressionVal}>
              {lastLoad ?? "Sem histórico"}
            </span>
          </div>
          {suggestedLoad ? (
            <div className={styles.itemProgressionSuggestion}>
              <Sparkles size={13} aria-hidden="true" />
              <span>Sugestão: {suggestedLoad}</span>
            </div>
          ) : null}
        </div>

        {item.note ? <p className={styles.itemNote}>{item.note}</p> : null}
      </SurfaceCard>
    </li>
  );
}
