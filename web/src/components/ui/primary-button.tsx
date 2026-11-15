import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./ui.module.css";

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode;
  fullWidth?: boolean;
};

export function PrimaryButton({
  icon,
  fullWidth = false,
  className,
  children,
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      type="button"
      className={[
        styles.primaryButton,
        "bg-primary radius-btn",
        fullWidth ? styles.primaryButtonFull : null,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      <span>{children}</span>
    </button>
  );
}

type PrimaryLinkButtonProps = {
  href: string;
  icon?: ReactNode;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
};

export function PrimaryLinkButton({
  href,
  icon,
  fullWidth = false,
  className,
  children,
}: PrimaryLinkButtonProps) {
  return (
    <Link
      href={href}
      className={[
        styles.primaryButton,
        "bg-primary radius-btn",
        fullWidth ? styles.primaryButtonFull : null,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      <span>{children}</span>
    </Link>
  );
}
