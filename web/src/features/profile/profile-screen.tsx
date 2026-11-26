"use client";

import { useSetAtom } from "jotai";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataRow } from "@/components/ui/data-row";
import { ErrorState } from "@/components/ui/error-state";
import { Notice } from "@/components/ui/notice";
import { SectionLabel } from "@/components/ui/section-label";
import { Skeleton } from "@/components/ui/skeleton";
import { userSummarySchema, type UserSummary } from "@/contracts/auth";
import { formatDate } from "@/lib/format";
import { request } from "@/lib/http";
import { timeZoneLabel } from "@/lib/timezones";
import { useResource } from "@/lib/use-resource";
import { sessionAtom } from "@/stores/session";
import { EditProfileDialog } from "./edit-profile-dialog";
import styles from "./profile.module.css";

export function ProfileScreen() {
  const setSession = useSetAtom(sessionAtom);
  const { data, error, isLoading, reload } = useResource("profile", () =>
    request({ url: "/api/users/me" }, userSummarySchema),
  );
  const [isEditing, setIsEditing] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className={styles.screen}>
        <h1 className={styles.title}>Perfil</h1>
        <Skeleton lines={5} label="Carregando perfil…" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.screen}>
        <h1 className={styles.title}>Perfil</h1>
        <ErrorState message={error ?? "Não foi possível carregar o perfil."} onRetry={reload} />
      </div>
    );
  }

  function handleSaved(user: UserSummary) {
    setSession((current) => (current ? { ...current, user } : current));
    setIsEditing(false);
    setSavedMessage("Informações atualizadas.");
    reload();
  }

  return (
    <div className={styles.screen}>
      <h1 className={styles.title}>Perfil</h1>

      {savedMessage ? <Notice tone="success">{savedMessage}</Notice> : null}

      <section className={styles.section}>
        <SectionLabel>Dados da conta</SectionLabel>
        <div>
          <DataRow label="Nome" value={data.name} />
          <DataRow label="Usuário" value={`@${data.username}`} />
          <DataRow label="E-mail" value={data.email} />
          <DataRow label="Fuso horário" value={timeZoneLabel(data.timezone)} />
          <DataRow
            label="Membro desde"
            value={formatDate(data.createdAt, data.timezone)}
          />
        </div>
        <Button variant="secondary" fullWidth onClick={() => setIsEditing(true)}>
          Editar informações
        </Button>
      </section>

      {isEditing ? (
        <EditProfileDialog
          user={data}
          onSaved={handleSaved}
          onClose={() => setIsEditing(false)}
        />
      ) : null}
    </div>
  );
}
