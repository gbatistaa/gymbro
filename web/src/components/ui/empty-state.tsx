import type { ReactNode } from "react";
import styles from "./ui.module.css";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className={styles.state} role="status">
      <p className={styles.stateTitle}>{title}</p>
      {description ? <p className={styles.stateText}>{description}</p> : null}
      {action ? <div className={styles.stateAction}>{action}</div> : null}
    </div>
  );
}
