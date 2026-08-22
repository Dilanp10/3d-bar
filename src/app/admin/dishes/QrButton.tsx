"use client";

import { useRef } from "react";
import { QrBlock } from "./QrBlock";

export function QrButton({ id, name }: { id: string; name: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="text-xs text-foreground-muted hover:text-foreground transition-colors"
        title="Ver QR"
      >
        QR
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
