"use client";

import { Dumbbell, Home, TrendingUp, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./shell.module.css";

const DESTINATIONS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/train", label: "Train", icon: Dumbbell },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/profile", label: "Profile", icon: UserRound },
] as const;

function isCurrent(pathname: string, href: string) {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="Main navigation">
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
