import type { ComponentPropsWithRef } from "react";
import styles from "./ui.module.css";

type FieldProps = Omit<ComponentPropsWithRef<"input">, "id"> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
};

export function Field({
  id,
  label,
  hint,
  error,
  className,
  "aria-describedby": describedBy,
  ...rest
}: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const description = [describedBy, hintId, errorId].filter(Boolean).join(" ");

  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
        {hint ? (
          <span id={hintId} className={styles.hint}>
            {hint}
          </span>
        ) : null}
      </div>

      <input
        {...rest}
        id={id}
        className={[styles.input, className].filter(Boolean).join(" ")}
        aria-invalid={error ? true : undefined}
        aria-describedby={description || undefined}
      />

      {error ? (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
