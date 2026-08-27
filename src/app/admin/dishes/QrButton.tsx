"use client";

import { useRef } from "react";
import { QrBlock } from "./QrBlock";

export function QrButton({
  id,
  name,
  className,
}: {
  id: string;
  name: string;
  className?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className={
          className ??
          "text-xs text-foreground-muted hover:text-foreground transition-colors"
        }
        title="Ver QR"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <path d="M14 14h3v3M20 14v.01M14 20v.01M20 20v.01M17 17v.01" />
        </svg>
        Ver QR
      </button>
      <dialog
        ref={dialogRef}
        className="rounded-xl bg-background-elevated text-foreground border border-border p-6 backdrop:bg-black/60 max-w-sm w-full"
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{name}</h2>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="text-foreground-muted hover:text-foreground text-sm"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        <QrBlock dishId={id} dishName={name} size={320} />
      </dialog>
    </>
  );
}
