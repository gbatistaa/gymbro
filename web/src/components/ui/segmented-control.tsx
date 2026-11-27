"use client";

import { useId } from "react";
import styles from "./ui.module.css";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  /** Nome do grupo para leitores de tela. */
  legend: string;
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: "default" | "sm";
  className?: string;
};

/**
 * Escolha única entre poucas opções, sempre visíveis. Usa rádios nativos: setas do teclado trocam
 * a opção e o leitor de tela anuncia o grupo, sem JavaScript extra.
 */
export function SegmentedControl<T extends string>({
  legend,
  options,
  value,
  onChange,
  size = "default",
  className,
}: SegmentedControlProps<T>) {
  const name = useId();

  return (
    <fieldset
      className={[styles.segmented, size === "sm" ? styles.segmentedSm : null, className]
        .filter(Boolean)
        .join(" ")}
    >
      <legend className={styles.srOnly}>{legend}</legend>
      {options.map((option) => (
        <label key={option.value} className={styles.segment}>
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={option.value === value}
            onChange={() => onChange(option.value)}
            className={styles.segmentInput}
          />
          <span className={styles.segmentLabel}>{option.label}</span>
        </label>
      ))}
    </fieldset>
  );
}
