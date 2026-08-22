import Image from "next/image";
import { HERO_IMAGE_URL, BUSINESS_NAME } from "@/lib/content/business-info";

export function HeroSection() {
  return (
    <section className="relative min-h-[100dvh] overflow-hidden">
      {/* MOBILE: imagen de fondo full bleed + overlay para legibilidad */}
      <div className="absolute inset-0 lg:hidden">
        <Image
          src={HERO_IMAGE_URL}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover scale-105 fade-in"
        />
        <div aria-hidden className="absolute inset-0 bg-black/55" />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background"
        />
      </div>

      {/* DESKTOP: split layout — contenido izq, imagen en card der */}
      <div className="relative min-h-[100dvh] flex items-center px-6 sm:px-10 lg:px-16 py-24">
        <div className="w-full max-w-7xl mx-auto grid lg:grid-cols-[1fr_1fr] gap-12 items-center">
          {/* Columna texto */}
          <div className="flex flex-col items-center lg:items-start gap-7 text-center lg:text-left max-w-xl mx-auto lg:mx-0">
            <div className="fade-up flex items-center gap-2 rounded-full border border-accent/40 bg-black/50 backdrop-blur-sm px-4 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span className="text-[11px] uppercase tracking-[0.25em] text-accent">
                {BUSINESS_NAME}
              </span>
            </div>

            <h1 className="fade-up delay-100 text-5xl sm:text-6xl lg:text-7xl font-semibold leading-[1.02] text-white tracking-tight">
              La carta,
              <br />
              <span className="italic font-normal text-accent">en 3D.</span>
            </h1>

            <p className="fade-up delay-200 text-white/75 leading-relaxed text-base sm:text-lg max-w-md">
              Escaneá el QR de cualquier plato y mirá exactamente lo que vas a
              pedir, desde todos los ángulos.
            </p>

            <div className="fade-up delay-300 flex flex-col sm:flex-row items-center gap-3 mt-2">
              <a
                href="/menu"
                className="rounded-full bg-accent text-black font-semibold px-7 py-3 text-sm hover:bg-accent-hover transition-all hover:scale-105 shadow-lg shadow-accent/20"
              >
                Ver la carta completa
              </a>
              <a
                href="#como-funciona"
                className="rounded-full border border-white/25 bg-white/5 backdrop-blur-sm text-white/90 font-medium px-7 py-3 text-sm hover:bg-white/10 transition-colors"
              >
                Cómo funciona
              </a>
            </div>
          </div>

          {/* Columna imagen (solo desktop) */}
          <div className="fade-up delay-500 hidden lg:block relative">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden border border-border-strong shadow-2xl shadow-black/60">
              <Image
                src={HERO_IMAGE_URL}
                alt="Ambiente de Bar Sharif"
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"
              />
              {/* Corner decoration */}
              <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 px-3 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-white">
                  En vivo
                </span>
              </div>
            </div>
            {/* Floating decoration */}
            <div
              aria-hidden
              className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-accent/10 blur-3xl"
            />
            <div
              aria-hidden
              className="absolute -top-6 -right-6 w-40 h-40 rounded-full bg-accent/5 blur-3xl"
            />
          </div>
        </div>
      </div>

      <a
        href="#como-funciona"
        aria-label="Bajar"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 scroll-hint text-white/60 hover:text-white transition-colors"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M6 13l6 6 6-6" />
        </svg>
      </a>
    </section>
  );
}
