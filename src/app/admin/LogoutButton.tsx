"use client";

import { signOut } from "./logout/actions";

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut()}
      className="inline-flex items-center gap-1.5 text-sm text-foreground-dim hover:text-foreground transition-colors"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
      </svg>
      Salir
    </button>
  );
}
