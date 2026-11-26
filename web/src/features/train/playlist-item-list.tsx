"use client";

import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { NextTarget } from "@/contracts/analytics";
import type { PlaylistExercise } from "@/contracts/playlist";
import { PlaylistItemCard } from "./playlist-item-card";
import styles from "./train.module.css";

const SCREEN_READER_INSTRUCTIONS = {
  draggable:
    "Para reordenar, pressione espaço, use as setas para mover e pressione espaço de novo para soltar. Esc cancela.",
};

type PlaylistItemListProps = {
  items: PlaylistExercise[];
  archivedExerciseIds: Set<string>;
  targetsByExercise: Map<string, NextTarget>;
  isLocked: boolean;
  onReorder: (items: PlaylistExercise[]) => void;
  onEdit: (item: PlaylistExercise) => void;
  onRemove: (item: PlaylistExercise) => void;
};

/** Lista de exercícios da ficha. Arraste o card em qualquer ponto (toque longo no celular) ou use a alça pelo teclado. */
export function PlaylistItemList({
  items,
  archivedExerciseIds,
  targetsByExercise,
  isLocked,
  onReorder,
  onEdit,
  onRemove,
}: PlaylistItemListProps) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function nameOf(id: UniqueIdentifier): string {
    return items.find((item) => item.id === id)?.exerciseName ?? "Exercício";
  }

  function positionOf(id: UniqueIdentifier): number {
    return items.findIndex((item) => item.id === id) + 1;
  }

  const announcements: Announcements = {
    onDragStart: ({ active }) =>
      `${nameOf(active.id)} selecionado, posição ${positionOf(active.id)} de ${items.length}.`,
    onDragOver: ({ active, over }) =>
      over ? `${nameOf(active.id)} está na posição ${positionOf(over.id)} de ${items.length}.` : undefined,
    onDragEnd: ({ active, over }) =>
      over
        ? `${nameOf(active.id)} movido para a posição ${positionOf(over.id)} de ${items.length}.`
        : `${nameOf(active.id)} solto sem mudar de posição.`,
    onDragCancel: ({ active }) => `Reordenação de ${nameOf(active.id)} cancelada.`,
  };

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;

    const from = items.findIndex((item) => item.id === active.id);
    const to = items.findIndex((item) => item.id === over.id);
    if (from < 0 || to < 0) return;

    onReorder(arrayMove(items, from, to));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      accessibility={{ announcements, screenReaderInstructions: SCREEN_READER_INSTRUCTIONS }}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className={styles.itemList}>
          {items.map((item, index) => (
            <PlaylistItemCard
              key={item.id}
              item={item}
              position={index + 1}
              isArchived={archivedExerciseIds.has(item.exerciseId)}
              target={targetsByExercise.get(item.exerciseId)}
              isLocked={isLocked}
              onEdit={onEdit}
              onRemove={onRemove}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
