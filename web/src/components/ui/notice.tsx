import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./ui.module.css";

type NoticeTone = "info" | "error" | "success";

const TONE_CLASS: Record<NoticeTone, string> = {
  info: styles.noticeInfo,
  error: styles.noticeError,
  success: styles.noticeSuccess,
};

const TONE_ICON = {
  info: Info,
  error: AlertCircle,
  success: CheckCircle2,
};

export function Notice({
  tone = "info",
  children,
}: {
  tone?: NoticeTone;
  children: ReactNode;
}) {
  const Icon = TONE_ICON[tone];

  return (
    <div
      className={`${styles.notice} ${TONE_CLASS[tone]}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <Icon size={18} aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}
