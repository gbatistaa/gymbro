"use client";

import { useId, useState } from "react";
import { Field } from "@/components/ui/field";
import { SegmentedControl, type SegmentedOption } from "@/components/ui/segmented-control";
import {
  addDays,
  addMonths,
  calendarRange,
  exercisePresetRange,
  todayIn,
  type CalendarDate,
  type ExerciseRangePreset,
  type TimeRange,
} from "@/lib/date-ranges";
import styles from "../progress.module.css";

export type RangeSelection =
  | { preset: ExerciseRangePreset }
  | { preset: "custom"; firstDay: CalendarDate; lastDay: CalendarDate };

type RangeOption = ExerciseRangePreset | "custom";

export const PRESET_OPTIONS: readonly SegmentedOption<ExerciseRangePreset>[] = [
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
  { value: "year", label: "Ano" },
];

const OPTIONS_WITH_CUSTOM: readonly SegmentedOption<RangeOption>[] = [
  ...PRESET_OPTIONS,
  { value: "custom", label: "Personalizado" },
];

export function resolveRange(selection: RangeSelection, timeZone: string): TimeRange {
  return selection.preset === "custom"
    ? calendarRange(selection.firstDay, selection.lastDay, timeZone)
    : exercisePresetRange(selection.preset, timeZone);
}

type RangePickerProps = {
  value: RangeSelection;
  onChange: (selection: RangeSelection) => void;
  timeZone: string;
};

/** Semana, mês, ano ou datas escolhidas. Só repassa um período customizado quando ele é válido. */
export function RangePicker({ value, onChange, timeZone }: RangePickerProps) {
  const today = todayIn(timeZone);
  const [draft, setDraft] = useState(() =>
    value.preset === "custom"
      ? { firstDay: value.firstDay, lastDay: value.lastDay }
      : { firstDay: addDays(addMonths(today, -3), 1), lastDay: today },
  );
  const firstId = useId();
  const lastId = useId();

  const isInverted = draft.firstDay !== "" && draft.lastDay !== "" && draft.firstDay > draft.lastDay;

  function choose(option: RangeOption) {
    onChange(option === "custom" ? { preset: "custom", ...draft } : { preset: option });
  }

  function updateDraft(next: { firstDay: CalendarDate; lastDay: CalendarDate }) {
    setDraft(next);
    if (next.firstDay !== "" && next.lastDay !== "" && next.firstDay <= next.lastDay) {
      onChange({ preset: "custom", ...next });
    }
  }

  return (
    <div className={styles.rangePicker}>
      <SegmentedControl
        legend="Período"
        options={OPTIONS_WITH_CUSTOM}
        value={value.preset}
        onChange={choose}
        size="sm"
      />
      {value.preset === "custom" ? (
        <div className={styles.customRange}>
          <Field
            id={firstId}
            label="De"
            type="date"
            value={draft.firstDay}
            max={today}
            onChange={(event) => updateDraft({ ...draft, firstDay: event.target.value })}
          />
          <Field
            id={lastId}
            label="Até"
            type="date"
            value={draft.lastDay}
            max={today}
            error={isInverted ? "A data inicial precisa ser antes da final." : undefined}
            onChange={(event) => updateDraft({ ...draft, lastDay: event.target.value })}
          />
        </div>
      ) : null}
    </div>
  );
}

