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
      className="relative px-6 sm:px-10 lg:px-16 py-20 sm:py-28 max-w-6xl mx-auto w-full scroll-mt-8"
    >
      <div className="mb-12 sm:mb-16 max-w-2xl">
        <span className="text-[11px] uppercase tracking-[0.25em] text-accent-dim">
          Cómo funciona
        </span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground mt-3 leading-tight">
          Tres pasos,
          <br className="hidden sm:block" />
          <span className="italic font-normal text-accent"> cero fricción.</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
        {STEPS.map((step, i) => (
          <div
            key={step.n}
            className="relative rounded-2xl border border-border bg-background-elevated/50 p-6 sm:p-7 hover:border-border-strong transition-colors"
          >
            <div className="text-4xl sm:text-5xl font-semibold text-accent/70 tabular-nums mb-4">
              {step.n}
            </div>
            <h3 className="text-lg sm:text-xl font-medium text-foreground mb-2">
              {step.title}
            </h3>
            <p className="text-sm text-foreground-muted leading-relaxed">
              {step.body}
            </p>

            {i < STEPS.length - 1 && (
              <div
                aria-hidden
                className="hidden sm:block absolute top-1/2 -right-4 w-6 h-px bg-gradient-to-r from-border-strong to-transparent"
              />
            )}
          </div>
        ))}
      </div>

    </section>
  );
}
