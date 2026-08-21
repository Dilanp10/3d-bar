export default function NotFound() {
  return (
    <main className="min-h-dvh grid place-items-center px-6 text-center">
      <div className="max-w-sm flex flex-col items-center gap-6">
        <span className="text-xs uppercase tracking-[0.3em] text-accent">
          Bar Sharif
        </span>
        <h1 className="text-3xl font-semibold text-foreground">
          Este plato no está disponible
        </h1>
        <p className="text-foreground-muted leading-relaxed">
          Puede que el QR sea de una carta anterior o que el plato ya no esté en
          el menú. Pedile una carta actualizada al mozo.
        </p>
        {/* TODO(M04+): link a la carta completa cuando exista índice público */}
      </div>
    </main>
  );
}
