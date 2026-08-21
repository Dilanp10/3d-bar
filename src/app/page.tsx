export default function Home() {
  return (
    <main className="min-h-dvh grid place-items-center px-6 text-center">
      <div className="max-w-md flex flex-col items-center gap-6">
        <span className="text-xs uppercase tracking-[0.3em] text-accent">
          Bar Sharif
        </span>
        <h1 className="text-4xl sm:text-5xl font-semibold leading-tight text-foreground">
          La carta, en 3D.
        </h1>
        <p className="text-foreground-muted leading-relaxed">
          Escaneá el QR de cualquier plato de la mesa para verlo desde todos los
          ángulos antes de pedirlo.
        </p>
        <p className="text-foreground-dim text-sm">
          Administración: <a href="/admin" className="text-accent hover:text-accent-hover transition-colors underline underline-offset-2">panel admin</a>
        </p>
      </div>
    </main>
  );
}
