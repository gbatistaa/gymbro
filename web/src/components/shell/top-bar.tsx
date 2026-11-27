"use client";

import { Dumbbell } from "lucide-react";
import { useAtomValue } from "jotai";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useLoadProfilePhoto } from "@/features/profile/use-load-profile-photo";
import { initialsOf } from "@/lib/initials";
import { profilePhotoAtom } from "@/stores/profile-photo";
import { sessionAtom } from "@/stores/session";
import styles from "./shell.module.css";

const AVATAR_SIZE = 30;

export function TopBar() {
  const user = useAtomValue(sessionAtom)?.user;
  const photo = useAtomValue(profilePhotoAtom);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const userInitials = initialsOf(user?.name);
  const visiblePhotoUrl = photo && photo.url !== failedUrl ? photo.url : null;
  useLoadProfilePhoto();

  return (
    <header className={styles.topBar}>
      <div className={styles.topBarInner}>
        <Link href="/" className={styles.brandGroup}>
          <span className={styles.brandMark} aria-hidden="true">
            <Dumbbell size={18} strokeWidth={2} />
          </span>
          <span className={styles.brandWordmark}>GYMBRO</span>
        </Link>

        <div className={styles.topActions}>
          <Link
            href="/profile"
            className={styles.avatarBadge}
            aria-label="Abrir perfil"
          >
            {user?.username ? (
              <span className={styles.topUserHandle}>@{user.username}</span>
            ) : null}
            <span className={styles.avatarCircle}>
              {visiblePhotoUrl ? (
                <Image
                  src={visiblePhotoUrl}
                  alt=""
                  width={AVATAR_SIZE}
                  height={AVATAR_SIZE}
                  // link assinado e temporário do bucket; GIF precisa chegar intacto para animar
                  unoptimized
                  className={styles.avatarCircleImage}
                  onError={() => setFailedUrl(visiblePhotoUrl)}
                />
              ) : (
                userInitials
              )}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
