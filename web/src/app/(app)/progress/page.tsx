import shell from "@/features/shell/shell.module.css";

export default function ProgressPage() {
  return (
    <section>
      <h1 className={shell.pageTitle}>Progress</h1>
      <p className={shell.pageText}>
        History, volume and progress per exercise.
      </p>
    </section>
  );
}
