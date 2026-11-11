"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import styles from "./auth.module.css";

type AuthFieldProps = {
  id: string;
  name: string;
  label: string;
  type?: "text" | "email" | "password";
  autoComplete: string;
  value: string;
  hint?: string;
  error?: string;
  onChange: (value: string) => void;
};

export function AuthField({
  id,
  name,
  label,
  type = "text",
  autoComplete,
  value,
  hint,
  error,
  onChange,
}: AuthFieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && isVisible ? "text" : type;
  const errorId = `${id}-error`;

  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
        {hint ? <span className={styles.hint}>{hint}</span> : null}
      </div>

      <div className={styles.inputShell}>
        <input
          id={id}
          name={name}
          className={`${styles.input} ${isPassword ? styles.inputWithAction : ""}`}
          type={inputType}
          autoComplete={autoComplete}
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />

        {isPassword ? (
          <button
            type="button"
            className={styles.reveal}
            onClick={() => setIsVisible((visible) => !visible)}
            aria-label={isVisible ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={isVisible}
          >
            {isVisible ? (
              <EyeOff size={20} aria-hidden="true" />
            ) : (
              <Eye size={20} aria-hidden="true" />
            )}
          </button>
        ) : null}
      </div>

      {error ? (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
