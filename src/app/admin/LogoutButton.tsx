"use client";

import { signOut } from "./logout/actions";

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut()}
      className="text-sm text-foreground-dim hover:text-foreground transition-colors"
    >
      Salir
    </button>
  );
}
