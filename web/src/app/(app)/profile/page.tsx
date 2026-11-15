import shell from "@/features/shell/shell.module.css";

export default function ProfilePage() {
  return (
    <section>
      <h1 className={shell.pageTitle}>Perfil</h1>
      <p className={shell.pageText}>Seus dados e preferências.</p>
    </section>
  );
}
