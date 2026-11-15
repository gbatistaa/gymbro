import shell from "@/features/shell/shell.module.css";

export default function ProgressPage() {
  return (
    <section>
      <h1 className={shell.pageTitle}>Progresso</h1>
      <p className={shell.pageText}>
        Histórico, volume e evolução por exercício.
      </p>
    </section>
  );
}
