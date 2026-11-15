"use client";

import { Dumbbell, Home, TrendingUp, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./shell.module.css";

const DESTINATIONS = [
  { href: "/", label: "Início", icon: Home, matchPrefixes: ["/"] },
  {
    href: "/treinar",
    label: "Treinar",
    icon: Dumbbell,
    matchPrefixes: ["/treinar", "/train"],
  },
  {
    href: "/progress",
    label: "Progresso",
    icon: TrendingUp,
    matchPrefixes: ["/progress"],
  },
  {
    href: "/profile",
    label: "Perfil",
    icon: UserRound,
    matchPrefixes: ["/profile"],
  },
] as const;

function isCurrentRoute(pathname: string, matchPrefixes: readonly string[]) {
  return matchPrefixes.some((prefix) =>
    prefix === "/"
      ? pathname === "/"
      : pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className={`${styles.bottomNav} bg-surface border-token`} aria-label="Navegação principal">
      <ul className={styles.bottomNavList}>
        {DESTINATIONS.map(({ href, label, icon: Icon, matchPrefixes }) => {
          const active = isCurrentRoute(pathname, matchPrefixes);

          return (
            <li key={href}>
              <Link
                href={href}
                className={[
                  styles.bottomNavItem,
                  active ? `${styles.bottomNavItemActive} text-primary` : "text-muted",
                ].join(" ")}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
