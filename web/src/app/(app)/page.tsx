import shell from "@/features/shell/shell.module.css";

export default function HomePage() {
  return (
    <section>
      <h1 className={shell.pageTitle}>Início</h1>
      <p className={shell.pageText}>
        O resumo do seu treino aparece aqui.
      </p>
    </section>
  );
}
