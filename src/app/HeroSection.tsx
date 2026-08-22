import Image from "next/image";
import { HERO_IMAGE_URL, BUSINESS_NAME } from "@/lib/content/business-info";

export function HeroSection() {
  return (
    <section className="relative min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center overflow-hidden">
      <Image
        src={HERO_IMAGE_URL}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover scale-105 fade-in"
      />
      {/* Radial + linear overlay for depth */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.75) 55%, #0a0a0a 100%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-background"
      />

      <div className="relative max-w-2xl flex flex-col items-center gap-7 pb-16">
        <div className="fade-up flex items-center gap-2 rounded-full border border-accent/30 bg-black/40 backdrop-blur-sm px-4 py-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[11px] uppercase tracking-[0.25em] text-accent">
            {BUSINESS_NAME}
          </span>
        </div>

        <h1 className="fade-up delay-100 text-5xl sm:text-7xl font-semibold leading-[1.05] text-white tracking-tight">
          La carta,
          <br />
          <span className="italic font-normal text-accent">en 3D.</span>
        </h1>

        <p className="fade-up delay-200 text-white/70 leading-relaxed text-lg max-w-md">
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
            className="rounded-full border border-white/20 text-white/90 font-medium px-7 py-3 text-sm hover:bg-white/5 transition-colors"
          >
            Cómo funciona
          </a>
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
