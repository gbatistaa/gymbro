import type { ReactNode } from "react";
import styles from "./ui.module.css";

type SectionHeaderProps = {
  children: ReactNode;
  icon?: ReactNode;
};

export function SectionHeader({ children, icon }: SectionHeaderProps) {
  return (
    <h2 className={styles.sectionHeader}>
      <span className={styles.sectionHeaderTitleGroup}>
        {icon ? (
          <span className={`${styles.sectionHeaderIcon} text-primary`} aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <span className={`${styles.sectionHeaderText} text-muted`}>{children}</span>
      </span>
      <span className={styles.sectionHeaderRule} aria-hidden="true" />
    </h2>
  );
}
