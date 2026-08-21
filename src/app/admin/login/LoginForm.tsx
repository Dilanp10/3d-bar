"use client";

import { useActionState } from "react";
import { signIn, type SignInState } from "./actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<SignInState, FormData>(
    signIn,
    null,
  );

  return (
    <form action={formAction} className="w-full max-w-sm flex flex-col gap-5">
      <h1 className="text-2xl font-semibold text-center text-foreground">
        Admin — Bar Sharif
      </h1>

      {state?.error && (
        <p
          role="alert"
          className="text-sm text-red-400 bg-red-400/10 rounded-lg px-4 py-2.5 text-center"
        >
          {state.error}
        </p>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-foreground-muted">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded-lg bg-background-panel border border-border px-4 py-2.5 text-foreground placeholder:text-foreground-dim focus:border-accent focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-foreground-muted">Contraseña</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="current-password"
          className="rounded-lg bg-background-panel border border-border px-4 py-2.5 text-foreground placeholder:text-foreground-dim focus:border-accent focus:outline-none"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent text-black font-medium px-4 py-2.5 hover:bg-accent-hover transition-colors disabled:opacity-50"
      >
        {pending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
