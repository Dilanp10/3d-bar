"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { BUSINESS_NAME } from "@/lib/content/business-info";

export function HeroSection() {
  const heroRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const midRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const hero = heroRef.current;
    const bg = bgRef.current;
    const mid = midRef.current;
    const fg = fgRef.current;
    if (!hero || !bg || !mid || !fg) return;

    const layers = [
      { el: bg, depth: 0.35, sway: 1.6 },
      { el: mid, depth: 0.9, sway: 3.5 },
      { el: fg, depth: 2.2, sway: 7 },
    ];

    let px = 0;
    let py = 0;
    let targetPx = 0;
    let targetPy = 0;
    let raf = 0;
    let visible = true;

    const setPointer = (clientX: number, clientY: number) => {
      const r = hero.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      targetPx = Math.max(-1, Math.min(1, (clientX - cx) / (r.width / 2)));
      targetPy = Math.max(-1, Math.min(1, (clientY - cy) / (r.height / 2)));
    };

    const onMove = (e: PointerEvent) => setPointer(e.clientX, e.clientY);
    const onLeave = () => {
      targetPx = 0;
      targetPy = 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) setPointer(e.touches[0].clientX, e.touches[0].clientY);
    };

    hero.addEventListener("pointermove", onMove);
    hero.addEventListener("pointerleave", onLeave);
    hero.addEventListener("touchmove", onTouchMove, { passive: true });
    hero.addEventListener("touchend", onLeave);

    // Pausa el rAF cuando la sección sale de viewport — evita gastar batería
    // en el resto de la página.
    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? false;
        if (visible) raf = requestAnimationFrame(tick);
      },
      { threshold: 0 },
    );
    io.observe(hero);

    const start = performance.now();
    function tick(now: number) {
      px += (targetPx - px) * 0.08;
      py += (targetPy - py) * 0.08;
      const t = (now - start) / 1000;
      const sx = Math.sin(t * 0.78);
      const sy = Math.cos(t * 0.55);
      for (const l of layers) {
        const x = -px * l.depth * 14 + sx * l.sway;
        const y = -py * l.depth * 10 + sy * l.sway * 0.6;
        l.el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
      }
      if (visible) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      hero.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerleave", onLeave);
      hero.removeEventListener("touchmove", onTouchMove);
      hero.removeEventListener("touchend", onLeave);
    };
  }, []);

  const midMask =
    "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.95) 40%, rgba(0,0,0,1) 100%)";
  const vignette =
    "radial-gradient(ellipse at 50% 60%, transparent 30%, rgba(0,0,0,0.5) 90%), linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 25%, transparent 55%, rgba(10,10,10,0.95) 100%)";

  return (
    <section
      ref={heroRef}
      className="relative isolate overflow-hidden min-h-[100dvh] flex flex-col items-center justify-end"
    >
      {/* Capa 1 — fondo desenfocado (más lejos, se mueve menos) */}
      <div
        ref={bgRef}
        aria-hidden
        className="absolute -inset-[3%] will-change-transform"
      >
        <Image
          src="/hero/bar-bg-blur.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover brightness-[0.55] saturate-[0.9]"
        />
      </div>

      {/* Capa 2 — foto nítida, con máscara que la funde al negro abajo */}
      <div
        ref={midRef}
        className="absolute -inset-[6%] will-change-transform"
        style={{ maskImage: midMask, WebkitMaskImage: midMask }}
      >
        <Image
          src="/hero/bar-bg.jpg"
          alt="Ambiente del 3D Bar"
          fill
          priority
          sizes="100vw"
          className="object-cover brightness-[0.72] contrast-[1.05] saturate-[1.05]"
        />
      </div>

      {/* Viñeteado + fadeout al final de la sección */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ background: vignette }}
      />

      {/* Capa 3 — bokeh dorado, adelante (se mueve más) */}
      <div
        ref={fgRef}
        aria-hidden
        className="absolute -inset-[6%] pointer-events-none will-change-transform"
      >
        <svg
          viewBox="0 0 375 812"
          preserveAspectRatio="xMidYMid slice"
          className="w-full h-full"
        >
          <g style={{ filter: "blur(6px)" }} fill="rgba(245, 182, 66, 0.24)">
            <circle cx="60" cy="180" r="18" />
            <circle cx="310" cy="260" r="14" />
            <circle cx="200" cy="90" r="22" />
          </g>
          <g style={{ filter: "blur(2px)" }} fill="rgba(245, 182, 66, 0.45)">
            <circle cx="90" cy="440" r="5" />
            <circle cx="280" cy="380" r="4" />
            <circle cx="340" cy="150" r="3" />
            <circle cx="30" cy="360" r="3" />
            <circle cx="170" cy="500" r="6" />
          </g>
        </svg>
      </div>

      {/* Contenido */}
      <div className="relative z-10 max-w-2xl w-full px-6 pb-16 sm:pb-20 pt-32 flex flex-col items-center gap-5 sm:gap-6 text-center">
        <div className="fade-up flex items-center gap-2 rounded-full border border-accent/40 bg-black/50 backdrop-blur-sm px-4 py-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[11px] uppercase tracking-[0.25em] text-accent">
            {BUSINESS_NAME}
          </span>
        </div>

        <h1 className="fade-up delay-100 text-6xl sm:text-7xl lg:text-8xl font-semibold leading-[0.98] tracking-tight text-white [text-wrap:balance] [text-shadow:0_4px_24px_rgba(0,0,0,0.6)]">
          La carta,
          <br />
          <span className="italic font-normal text-accent">en 3D.</span>
        </h1>

        <p className="fade-up delay-200 text-base sm:text-lg text-white/80 max-w-md leading-relaxed [text-shadow:0_2px_12px_rgba(0,0,0,0.7)]">
          Escaneá el QR de cualquier plato y miralo desde todos los ángulos.
        </p>

        <div className="fade-up delay-300 flex flex-col sm:flex-row items-center gap-3 mt-2 w-full sm:w-auto">
          <Link
            href="/menu"
            className="w-full sm:w-auto rounded-full bg-accent text-black font-semibold px-7 py-3.5 text-sm text-center hover:bg-accent-hover transition-all sm:hover:scale-105 shadow-[0_12px_30px_-8px_rgba(245,182,66,0.5)]"
          >
            Ver la carta completa
          </Link>
          <a
            href="#como-funciona"
            className="w-full sm:w-auto rounded-full border border-white/20 bg-black/40 backdrop-blur-sm text-white/90 font-medium px-7 py-3.5 text-sm text-center hover:bg-white/10 transition-colors"
          >
            Cómo funciona
          </a>
        </div>
      </div>

      <a
        href="#como-funciona"
        aria-label="Bajar"
        className="relative z-10 mb-6 mt-2 scroll-hint text-white/50 hover:text-white transition-colors"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5v14M6 13l6 6 6-6" />
        </svg>
      </a>
    </section>
  );
}
