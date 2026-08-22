const STEPS = [
  {
    n: "01",
    title: "Escaneá el QR",
    body: "Cada plato de la mesa tiene su código. Apuntá con la cámara del celular.",
  },
  {
    n: "02",
    title: "Miralo en 3D",
    body: "Se abre la landing del plato. Girá el modelo, hacé zoom, incluso probá AR.",
  },
  {
    n: "03",
    title: "Pedilo con confianza",
    body: "Sabés exactamente qué te va a llegar antes de decidir. Sin sorpresas.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="como-funciona"
      className="relative px-6 sm:px-8 py-24 max-w-5xl mx-auto w-full scroll-mt-8"
    >
      <div className="mb-14 text-center">
        <span className="text-[11px] uppercase tracking-[0.25em] text-accent-dim">
          Cómo funciona
        </span>
        <h2 className="text-3xl sm:text-4xl font-semibold text-foreground mt-3">
          Tres pasos, cero fricción.
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4">
        {STEPS.map((step, i) => (
          <div
            key={step.n}
            className="relative rounded-2xl border border-border bg-background-elevated/50 p-6 hover:border-border-strong transition-colors"
          >
            <div className="text-4xl font-semibold text-accent/80 tabular-nums mb-4">
              {step.n}
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              {step.title}
            </h3>
            <p className="text-sm text-foreground-muted leading-relaxed">
              {step.body}
            </p>

            {i < STEPS.length - 1 && (
              <div
                aria-hidden
                className="hidden sm:block absolute top-1/2 -right-3 w-6 h-px bg-gradient-to-r from-border-strong to-transparent"
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
