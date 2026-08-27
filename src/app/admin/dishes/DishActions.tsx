"use client";

import Link from "next/link";
import { toggleDishActive, deleteDish } from "./actions";
import { QrButton } from "./QrButton";

const btn =
  "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium min-h-[40px] transition-colors";

export function DishActions({
  id,
  name,
  active,
}: {
  id: string;
  name: string;
  active: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Link
        href={`/admin/dishes/${id}/edit`}
        className={`${btn} bg-accent text-black hover:bg-accent-hover`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
        </svg>
        Editar
      </Link>

      <QrButton id={id} name={name} className={`${btn} border border-border text-foreground hover:bg-background-elevated`} />

      <button
        type="button"
        onClick={() => toggleDishActive(id, !active)}
        className={`${btn} border border-border text-foreground hover:bg-background-elevated`}
      >
        {active ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C5 20 1 12 1 12a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
        {active ? "Ocultar" : "Mostrar"}
      </button>

      <button
        type="button"
        onClick={async () => {
          if (
            confirm(
              `Se va a borrar «${name}».\n\nEsto no se puede deshacer.`,
            )
          ) {
            await deleteDish(id);
          }
        }}
        className={`${btn} border border-red-500/30 text-red-300 hover:bg-red-500/10`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
          <path d="M10 11v6M14 11v6" />
        </svg>
        Borrar
      </button>
    </div>
  );
}
