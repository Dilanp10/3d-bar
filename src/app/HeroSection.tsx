import Image from "next/image";
import { HERO_IMAGE_URL } from "@/lib/content/business-info";

export function HeroSection() {
  return (
    <section className="relative min-h-[70dvh] flex items-center justify-center px-6 text-center overflow-hidden">
      <Image
        src={HERO_IMAGE_URL}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black" />

      <div className="relative max-w-md flex flex-col items-center gap-6">
        <span className="text-xs uppercase tracking-[0.3em] text-accent">
          Bar Sharif
        </span>
        <h1 className="text-4xl sm:text-5xl font-semibold leading-tight text-white">
          La carta, en 3D.
        </h1>
        <p className="text-white/80 leading-relaxed">
          Escaneá el QR de cualquier plato de la mesa para verlo desde todos
          los ángulos antes de pedirlo.
        </p>
        <a
          href="/menu"
          className="rounded-lg bg-accent text-black font-medium px-5 py-2.5 text-sm hover:bg-accent-hover transition-colors"
        >
          Ver la carta completa
        </a>
        <p className="text-white/50 text-sm">
          Administración:{" "}
          <a
            href="/admin"
            className="text-accent hover:text-accent-hover transition-colors underline underline-offset-2"
          >
            panel admin
          </a>
        </p>
      </div>
    </section>
  );
}
