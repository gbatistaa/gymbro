"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./ui.module.css";

const SCREEN_READER_INSTRUCTIONS = {
  draggable:
    "Para reordenar, pressione espaço, use as setas para mover e pressione espaço de novo para soltar. Esc cancela.",
};

type SortableListProps<T> = {
  items: readonly T[];
  getId: (item: T) => string;
  /** Nome do item, usado nos avisos para leitores de tela. */
  getLabel: (item: T) => string;
  onReorder: (items: T[]) => void;
  /** Recebe a alça de arrastar; ela só existe quando há mais de um item para reordenar. */
  renderItem: (item: T, dragHandle: ReactNode) => ReactNode;
  disabled?: boolean;
  className?: string;
};

type SortableRowProps = {
  id: string;
  label: string;
  isDisabled: boolean;
  isSortable: boolean;
  children: (dragHandle: ReactNode) => ReactNode;
};

function SortableRow({ id, label, isDisabled, isSortable, children }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled: isDisabled });

  const handle = isSortable ? (
    <button
      type="button"
      ref={setActivatorNodeRef}
      className={styles.dragHandle}
      aria-label={`Reordenar ${label}`}
      disabled={isDisabled}
      {...attributes}
      {...listeners}
    >
      <GripVertical size={16} strokeWidth={1.75} aria-hidden="true" />
    </button>
  ) : null;

  return (
    <li
      ref={setNodeRef}
      className={[styles.sortableRow, isDragging ? styles.sortableRowDragging : null]
        .filter(Boolean)
        .join(" ")}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      {children(handle)}
    </li>
  );
}

/**
 * Pilha vertical reordenável. O arraste começa só na alça, para não brigar com o que há dentro do
 * item (gráficos que reagem ao toque, botões). Funciona com mouse, toque e teclado.
 */
export function SortableList<T>({
  items,
  getId,
  getLabel,
  onReorder,
  renderItem,
  disabled = false,
  className,
}: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = items.map(getId);

  function labelOf(id: UniqueIdentifier): string {
    const item = items.find((candidate) => getId(candidate) === id);
    return item === undefined ? "Item" : getLabel(item);
  }

  function positionOf(id: UniqueIdentifier): number {
    return ids.indexOf(String(id)) + 1;
  }

  const announcements: Announcements = {
    onDragStart: ({ active }) =>
      `${labelOf(active.id)} selecionado, posição ${positionOf(active.id)} de ${ids.length}.`,
    onDragOver: ({ active, over }) =>
      over ? `${labelOf(active.id)} está na posição ${positionOf(over.id)} de ${ids.length}.` : undefined,
    onDragEnd: ({ active, over }) =>
      over
        ? `${labelOf(active.id)} movido para a posição ${positionOf(over.id)} de ${ids.length}.`
        : `${labelOf(active.id)} solto sem mudar de posição.`,
    onDragCancel: ({ active }) => `Reordenação de ${labelOf(active.id)} cancelada.`,
  };

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    onReorder(arrayMove([...items], from, to));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      accessibility={{ announcements, screenReaderInstructions: SCREEN_READER_INSTRUCTIONS }}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul className={[styles.sortableList, className].filter(Boolean).join(" ")}>
          {items.map((item) => (
            <SortableRow
              key={getId(item)}
              id={getId(item)}
              label={getLabel(item)}
              isDisabled={disabled}
              isSortable={items.length > 1}
            >
              {(handle) => renderItem(item, handle)}
            </SortableRow>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
