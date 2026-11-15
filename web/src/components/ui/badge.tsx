import type { ReactNode } from "react";
import styles from "./ui.module.css";

type BadgeTone = "neutral" | "primary" | "strong";

type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
};

const TONE_CLASS: Record<BadgeTone, string> = {
  neutral: `${styles.badgeNeutral} text-muted`,
  primary: `${styles.badgePrimary} text-primary`,
  strong: `${styles.badgeTextStrong} text-text`,
};

export function Badge({ children, tone = "neutral", className }: BadgeProps) {
  return (
    <span
      className={[
        styles.badge,
        "bg-surface-2 border-token",
        TONE_CLASS[tone],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}
