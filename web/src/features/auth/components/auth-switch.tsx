import Link from "next/link";
import styles from "./auth.module.css";

type AuthSwitchProps = {
  prompt: string;
  href: string;
  label: string;
};

export function AuthSwitch({ prompt, href, label }: AuthSwitchProps) {
  return (
    <p className={styles.switch}>
      {prompt}
      <Link className={styles.switchLink} href={href}>
        {label}
      </Link>
    </p>
  );
}
