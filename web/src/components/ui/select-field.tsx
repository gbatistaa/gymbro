"use client";

import { ChevronDown } from "lucide-react";
import type { ComponentPropsWithRef, ReactNode } from "react";
import styles from "./ui.module.css";

type SelectFieldProps = Omit<ComponentPropsWithRef<"select">, "id"> & {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
};

/** Seletor com a mesma aparência e a mesma semântica de erro do `Field`. */
export function SelectField({
  id,
  label,
  error,
  className,
  children,
  ...rest
}: SelectFieldProps) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
      </div>

      <div className={styles.selectShell}>
        <select
          {...rest}
          id={id}
          className={[styles.input, styles.selectInput, className].filter(Boolean).join(" ")}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
        >
          {children}
        </select>
        <ChevronDown
          size={18}
          strokeWidth={1.75}
          className={styles.selectChevron}
          aria-hidden="true"
        />
      </div>

      {error ? (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
