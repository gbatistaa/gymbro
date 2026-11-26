"use client";

import type { CSSProperties } from "react";
import { Toaster as SonnerToaster } from "sonner";

type CssVariables = CSSProperties & Record<`--${string}`, string>;

const TOP_OFFSET = "calc(var(--safe-area-top) + 12px)";

const toasterStyle: CssVariables = {
  fontFamily: "var(--font-plex-sans), system-ui, sans-serif",
  "--normal-bg": "var(--surface)",
  "--normal-text": "var(--text)",
  "--normal-border": "var(--border)",
  "--success-bg": "var(--surface)",
  "--success-text": "var(--text)",
  "--success-border": "var(--primary)",
  "--error-bg": "var(--surface)",
  "--error-text": "var(--text)",
  "--error-border": "var(--danger)",
};

/** Toasts sempre saem do topo, centralizados. Um toast por mensagem de erro. */
export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      theme="dark"
      visibleToasts={6}
      offset={{ top: TOP_OFFSET }}
      mobileOffset={{ top: TOP_OFFSET }}
      style={toasterStyle}
    />
  );
}
