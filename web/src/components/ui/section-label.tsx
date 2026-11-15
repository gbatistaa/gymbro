import type { ReactNode } from "react";
import styles from "./ui.module.css";

type SectionLabelProps = {
  children: ReactNode;
  /** Nível do heading. `div` para rótulo sem valor de estrutura. */
  as?: "h2" | "h3" | "div";
  className?: string;
};

export function SectionLabel({
  children,
  as = "h2",
  className,
}: SectionLabelProps) {
  const Heading = as;

  return (
    <Heading className={[styles.sectionLabel, className].filter(Boolean).join(" ")}>
      <span className={styles.sectionLabelText}>{children}</span>
    </Heading>
  );
}
