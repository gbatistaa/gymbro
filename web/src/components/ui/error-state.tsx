import { AlertCircle } from "lucide-react";
import { Button } from "./button";
import styles from "./ui.module.css";

type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
};

export function ErrorState({
  message,
  onRetry,
  retryLabel = "Tentar novamente",
}: ErrorStateProps) {
  return (
    <div className={`${styles.state} ${styles.stateError}`} role="alert">
      <AlertCircle
        className={styles.stateIcon}
        size={20}
        aria-hidden="true"
      />
      <p className={styles.stateTitle}>{message}</p>
      {onRetry ? (
        <div className={styles.stateAction}>
          <Button variant="secondary" onClick={onRetry}>
            {retryLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
