import styles from "./ui.module.css";

type SkeletonProps = {
  lines?: number;
  label?: string;
};

export function Skeleton({ lines = 3, label = "Carregando…" }: SkeletonProps) {
  return (
    <div className={styles.skeleton} role="status" aria-busy="true" aria-label={label}>
      {Array.from({ length: lines }, (_, index) => (
        <span key={index} className={styles.skeletonLine} aria-hidden="true" />
      ))}
    </div>
  );
}
