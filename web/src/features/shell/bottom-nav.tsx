"use client";

import { Dumbbell, Home, TrendingUp, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./shell.module.css";

const DESTINATIONS = [
  { href: "/", label: "Início", icon: Home },
  { href: "/train", label: "Treinar", icon: Dumbbell },
  { href: "/progress", label: "Progresso", icon: TrendingUp },
  { href: "/profile", label: "Perfil", icon: UserRound },
] as const;

function isCurrent(pathname: string, href: string) {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="Navegação principal">
      <span className={styles.navBrand} aria-hidden="true">
        GYMBRO
      </span>

      <ul className={styles.navList}>
        {DESTINATIONS.map(({ href, label, icon: Icon }) => {
          const current = isCurrent(pathname, href);

          return (
            <li key={href}>
              <Link
                href={href}
                className={[styles.navItem, current ? styles.navItemActive : null]
                  .filter(Boolean)
                  .join(" ")}
                aria-current={current ? "page" : undefined}
              >
                <Icon size={22} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
