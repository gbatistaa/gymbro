import Link from "next/link";
import type { ComponentProps, ComponentPropsWithRef } from "react";
import styles from "./ui.module.css";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "default" | "sm" | "icon";

type ButtonProps = ComponentPropsWithRef<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  /** Label read by screen readers while `isLoading`. */
  loadingLabel?: string;
};

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: styles.buttonPrimary,
  secondary: styles.buttonSecondary,
  ghost: styles.buttonGhost,
  danger: styles.buttonDanger,
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  default: "",
  sm: styles.buttonSm,
  icon: styles.buttonIcon,
};

export function Button({
  variant = "primary",
  size = "default",
  fullWidth = false,
  isLoading = false,
  loadingLabel = "Carregando…",
  type = "button",
  className,
  disabled,
  children,
  ...rest
}: ButtonProps) {
  const classes = [
    styles.button,
    VARIANT_CLASS[variant],
    SIZE_CLASS[size],
    fullWidth ? styles.buttonFullWidth : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      {...rest}
      type={type}
      className={classes}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
    >
      {isLoading ? <span className={styles.buttonSpinner} aria-hidden="true" /> : null}
      {children}
      {isLoading ? <span className={styles.srOnly}>{loadingLabel}</span> : null}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "default",
  fullWidth = false,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  const classes = [
    styles.button,
    VARIANT_CLASS[variant],
    SIZE_CLASS[size],
    fullWidth ? styles.buttonFullWidth : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Link {...rest} className={classes}>
      {children}
    </Link>
  );
}
