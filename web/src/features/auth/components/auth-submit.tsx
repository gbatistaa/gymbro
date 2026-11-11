import styles from "./auth.module.css";

type AuthSubmitProps = {
  isSubmitting: boolean;
  idleLabel: string;
  busyLabel: string;
};

export function AuthSubmit({
  isSubmitting,
  idleLabel,
  busyLabel,
}: AuthSubmitProps) {
  return (
    <button
      className={styles.submit}
      type="submit"
      disabled={isSubmitting}
      aria-busy={isSubmitting}
    >
      {isSubmitting ? (
        <>
          <span className={styles.bars} aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          {busyLabel}
        </>
      ) : (
        idleLabel
      )}
    </button>
  );
}
