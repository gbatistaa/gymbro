"use client";

import { Dumbbell, Home, Scale, TrendingUp, UserRound } from "lucide-react";
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
    href: "/bioimpedance",
    label: "Corpo",
    icon: Scale,
    matchPrefixes: ["/bioimpedance"],
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
    <nav className={styles.bottomNav} aria-label="Navegação principal">
      <ul className={styles.bottomNavList}>
        {DESTINATIONS.map(({ href, label, icon: Icon, matchPrefixes }) => {
          const active = isCurrentRoute(pathname, matchPrefixes);

          return (
            <li key={href}>
              <Link
                href={href}
                className={[
                  styles.bottomNavItem,
                  active ? styles.bottomNavItemActive : null,
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-current={active ? "page" : undefined}
              >
                <span className={styles.bottomNavIconWrap}>
                  <Icon size={20} strokeWidth={active ? 2.25 : 1.75} aria-hidden="true" />
                </span>
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
