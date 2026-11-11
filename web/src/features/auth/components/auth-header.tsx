import styles from "./auth.module.css";

type AuthHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function AuthHeader({ eyebrow, title, description }: AuthHeaderProps) {
  return (
    <header>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.description}>{description}</p>
    </header>
  );
}
