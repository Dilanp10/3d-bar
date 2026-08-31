"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import type { MenuSection, MenuDish } from "@/lib/db/menu";

type FlatDish = MenuDish & { category: string };

type Props = { sections: MenuSection[] };

const ALL = "Todos";

export function VitrinaMenu({ sections }: Props) {
  const dishes: FlatDish[] = useMemo(
    () =>
      sections.flatMap((s) =>
        s.dishes.map((d) => ({ ...d, category: s.name })),
      ),
    [sections],
  );

  const categories = useMemo(
    () => [ALL, ...sections.map((s) => s.name)],
    [sections],
  );

  const [activeCategory, setActiveCategory] = useState(ALL);
  const filtered: FlatDish[] = useMemo(
    () =>
      activeCategory === ALL
        ? dishes
        : dishes.filter((d) => d.category === activeCategory),
    [dishes, activeCategory],
  );

  const [activeIndex, setActiveIndex] = useState(0);
  // dragOffset: pixels of drag; converted to fractional-card offset by cardWidth
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number; index: number } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [cardWidth, setCardWidth] = useState(240);

  const selectCategory = useCallback((cat: string) => {
    setActiveCategory(cat);
    setActiveIndex(0);
    setDragOffset(0);
  }, []);

  useEffect(() => {
    const measure = () => {
      const w = stageRef.current?.clientWidth ?? 375;
      // Center card takes ~62% of viewport width, capped
      setCardWidth(Math.min(300, Math.max(180, w * 0.62)));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const clamp = useCallback(
    (i: number) => Math.max(0, Math.min(filtered.length - 1, i)),
    [filtered.length],
  );

  const goTo = useCallback(
    (i: number) => setActiveIndex(clamp(i)),
    [clamp],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    dragStart.current = { x: e.clientX, index: activeIndex };
    setIsDragging(true);
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragStart.current) return;
    const delta = e.clientX - dragStart.current.x;
    // Clamp visually so users can feel edges resist
    const maxDrag = cardWidth * 1.5;
    setDragOffset(Math.max(-maxDrag, Math.min(maxDrag, delta)));
  };

  const endDrag = () => {
    if (!dragStart.current) return;
    const advance = Math.round(-dragOffset / (cardWidth * 0.6));
    goTo(activeIndex + advance);
    setDragOffset(0);
    setIsDragging(false);
    dragStart.current = null;
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.tagName === "INPUT")
        return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goTo(activeIndex - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goTo(activeIndex + 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, goTo]);

  if (dishes.length === 0) return null;

  const active = filtered[activeIndex] ?? filtered[0];
  const dragCards = dragOffset / cardWidth;

  return (
    <div className="relative min-h-[calc(100dvh-4rem)] flex flex-col select-none">
      {/* Chips de categoría */}
      {categories.length > 2 && (
        <div className="pt-4 pb-2 px-4 overflow-x-auto scrollbar-none">
          <div className="flex gap-2 justify-center min-w-max mx-auto">
            {categories.map((cat) => {
              const isActive = cat === activeCategory;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => selectCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-[11px] uppercase tracking-[0.22em] font-medium transition-colors ${
                    isActive
                      ? "bg-accent text-black"
                      : "text-foreground-muted hover:text-foreground border border-border"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Vitrina 3D */}
      <div
        ref={stageRef}
        className="relative flex-1 min-h-[380px] touch-pan-y overflow-hidden cursor-grab active:cursor-grabbing"
        style={{ perspective: "1200px" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        role="listbox"
        aria-label="Carta de platos"
      >
        {/* Halo dorado ambiente detrás de la vitrina */}
        <div
          aria-hidden
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            width: `${cardWidth * 2.6}px`,
            height: `${cardWidth * 2.6}px`,
            background:
              "radial-gradient(circle, rgba(245,182,66,0.14) 0%, transparent 60%)",
            filter: "blur(6px)",
          }}
        />

        {/* Riel */}
        <div
          aria-hidden
          className="absolute left-0 right-0 top-1/2 pointer-events-none"
          style={{
            transform: `translateY(${cardWidth * 0.65}px)`,
            height: "1px",
            background:
              "linear-gradient(90deg, transparent 5%, rgba(245,182,66,0.35) 50%, transparent 95%)",
          }}
        />

        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ transformStyle: "preserve-3d" }}
        >
          {filtered.map((dish, i) => {
            const virtualOffset = i - activeIndex - dragCards;
            const abs = Math.abs(virtualOffset);
            const sign = Math.sign(virtualOffset);

            // Curva no lineal: laterales se van al fondo rápido
            const tx = virtualOffset * cardWidth * 0.55;
            const tz = -Math.min(abs * 120, 360);
            const ry = sign * -Math.min(abs * 22, 44);
            const opacity = Math.max(0.15, 1 - abs * 0.32);
            const scale = Math.max(0.55, 1 - abs * 0.12);
            const blur = abs > 1.4 ? Math.min((abs - 1.4) * 3, 6) : 0;

            const isCenter = abs < 0.5;
            const isVisible = abs < 3;

            if (!isVisible) return null;

            return (
              <button
                key={dish.id}
                type="button"
                onClick={(e) => {
                  if (Math.abs(dragOffset) > 5) return; // consumido por drag
                  if (isCenter) {
                    // navegar al plato
                    const link = e.currentTarget.querySelector(
                      "a",
                    ) as HTMLAnchorElement | null;
                    link?.click();
                  } else {
                    goTo(i);
                  }
                }}
                className="absolute focus:outline-none"
                style={{
                  transform: `translate3d(${tx}px, 0, ${tz}px) rotateY(${ry}deg) scale(${scale})`,
                  opacity,
                  filter: blur ? `blur(${blur}px)` : undefined,
                  transition: isDragging
                    ? "none"
                    : "transform 500ms cubic-bezier(0.16, 1, 0.3, 1), opacity 400ms ease, filter 400ms ease",
                  zIndex: 100 - Math.round(abs * 10),
                  width: `${cardWidth}px`,
                  height: `${cardWidth * 1.28}px`,
                }}
                aria-label={`${dish.name}, ${dish.price_display}`}
                aria-selected={isCenter}
                role="option"
                tabIndex={isCenter ? 0 : -1}
              >
                <VitrinaCard dish={dish} isCenter={isCenter} />
              </button>
            );
          })}
        </div>

        {/* Sombra bajo la card central para "asentar" el plato */}
        <div
          aria-hidden
          className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
          style={{
            bottom: "18%",
            width: `${cardWidth * 0.9}px`,
            height: `${cardWidth * 0.12}px`,
            background:
              "radial-gradient(ellipse at center, rgba(0,0,0,0.6) 0%, transparent 70%)",
            filter: "blur(8px)",
          }}
        />
      </div>

      {/* Info del plato activo */}
      <div className="relative z-10 px-6 pt-2 pb-6 text-center max-w-md mx-auto w-full">
        <div key={active.id} className="fade-up">
          <span className="text-[10px] uppercase tracking-[0.32em] text-accent-dim font-medium">
            {active.category}
            {active.has_model ? " · 3D" : ""}
          </span>
          <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mt-2 leading-tight [text-wrap:balance]">
            {active.name}
          </h2>
          <p className="text-accent text-xl font-semibold mt-1 tabular-nums">
            {active.price_display}
          </p>
        </div>

        <Link
          href={`/menu/${active.id}`}
          className="inline-flex items-center gap-2 mt-4 px-6 py-3 rounded-full bg-accent text-black font-semibold text-sm hover:bg-accent-hover transition-colors shadow-[0_10px_25px_-8px_rgba(245,182,66,0.5)]"
        >
          Ver plato
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Indicadores */}
      {filtered.length > 1 && (
        <div className="pb-4 flex justify-center gap-1.5">
          {filtered.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Ir al plato ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === activeIndex
                  ? "w-8 bg-accent"
                  : "w-1.5 bg-foreground-muted/30 hover:bg-foreground-muted/60"
              }`}
            />
          ))}
        </div>
      )}

      {/* Toggle a lista */}
      <div className="pb-6 text-center">
        <Link
          href="/menu?view=list"
          className="text-[11px] uppercase tracking-[0.22em] text-foreground-dim hover:text-foreground-muted transition-colors"
        >
          Ver como lista
        </Link>
      </div>
    </div>
  );
}

function VitrinaCard({
  dish,
  isCenter,
}: {
  dish: FlatDish;
  isCenter: boolean;
}) {
  return (
    <div
      className="relative w-full h-full rounded-2xl overflow-hidden bg-background-elevated"
      style={{
        boxShadow: isCenter
          ? "0 30px 60px -15px rgba(0,0,0,0.7), 0 0 0 1px rgba(245,182,66,0.25)"
          : "0 20px 40px -20px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)",
      }}
    >
      {dish.thumbnail_url ? (
        <Image
          src={dish.thumbnail_url}
          alt={dish.name}
          fill
          sizes="(min-width: 1024px) 30vw, 60vw"
          className="object-cover"
          draggable={false}
        />
      ) : (
        <div className="w-full h-full grid place-items-center text-foreground-dim text-xs">
          Sin foto
        </div>
      )}

      {/* Gradient de terminación */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* Badge 3D */}
      {dish.has_model && (
        <span className="absolute top-3 right-3 text-[10px] uppercase tracking-[0.22em] font-semibold text-black bg-accent px-2 py-1 rounded-full">
          3D
        </span>
      )}
    </div>
  );
}
