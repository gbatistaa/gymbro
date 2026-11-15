import type { HTMLAttributes, ReactNode } from "react";
import styles from "./ui.module.css";

type SurfaceCardProps = HTMLAttributes<HTMLElement> & {
  as?: "section" | "article" | "div";
  children: ReactNode;
};

export function SurfaceCard({
  as: Component = "section",
  className,
  children,
  ...props
}: SurfaceCardProps) {
  return (
    <Component
      className={[styles.surfaceCard, "bg-surface border-token radius-card", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </Component>
  );
}
