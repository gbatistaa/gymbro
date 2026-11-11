import { AlertCircle, Info } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./auth.module.css";

type AuthNoticeProps = {
  tone: "info" | "danger";
  children: ReactNode;
};

export function AuthNotice({ tone, children }: AuthNoticeProps) {
  const Icon = tone === "danger" ? AlertCircle : Info;
  const toneClass = tone === "danger" ? styles.noticeDanger : styles.noticeInfo;

  return (
    <div
      className={`${styles.notice} ${toneClass}`}
      role={tone === "danger" ? "alert" : "status"}
    >
      <Icon size={18} aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}
