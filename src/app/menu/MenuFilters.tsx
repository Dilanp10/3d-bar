"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { MenuSection } from "@/lib/db/menu";

type Props = { sections: MenuSection[] };

const ALL = "__all__";

export function MenuFilters({ sections }: Props) {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>(ALL);
  const [only3D, setOnly3D] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sections
      .filter((s) => activeCat === ALL || (s.id ?? "otros") === activeCat)
      .map((s) => ({
        ...s,
        dishes: s.dishes.filter((d) => {
          if (only3D && !d.has_model) return false;
          if (q && !d.name.toLowerCase().includes(q)) return false;
          return true;
        }),
      }))
      .filter((s) => s.dishes.length > 0);
  }, [sections, query, activeCat, only3D]);

  const totalFound = filtered.reduce((n, s) => n + s.dishes.length, 0);

  return (
    <>
      <div className="sticky top-0 z-20 -mx-5 sm:-mx-8 lg:-mx-12 pl-5 sm:pl-8 lg:pl-12 pr-16 sm:pr-20 lg:pr-24 pt-2 pb-3 lg:pt-4 lg:pb-4 bg-background/85 backdrop-blur-md border-b border-border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-6">
          <div className="relative lg:w-80 lg:flex-shrink-0 lg:order-1">
            <svg
              aria-hidden
              className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-dim"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar plato..."
              className="w-full bg-background-elevated border border-border rounded-xl pl-9 pr-9 py-2.5 text-sm text-foreground placeholder:text-foreground-dim focus:border-border-strong focus:outline-none transition-colors"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Limpiar búsqueda"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 grid place-items-center text-foreground-dim hover:text-foreground"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex gap-1.5 overflow-x-auto mt-3 lg:mt-0 lg:flex-1 lg:flex-wrap lg:overflow-visible -mx-1 px-1 pb-1 lg:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:order-2">
            <CatChip
              active={activeCat === ALL}
              onClick={() => setActiveCat(ALL)}
              label="Todo"
            />
            {sections.map((s) => (
              <CatChip
                key={s.id ?? "otros"}
                active={activeCat === (s.id ?? "otros")}
                onClick={() => setActiveCat(s.id ?? "otros")}
                label={s.name}
              />
            ))}
          </div>

          <div className="flex items-center gap-2 mt-2 lg:mt-0 lg:order-3 lg:flex-shrink-0">
            <button
              type="button"
              onClick={() => setOnly3D((v) => !v)}
              aria-pressed={only3D}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] transition-colors ${
                only3D
                  ? "border border-accent text-accent bg-accent/10"
                  : "border border-border-strong text-foreground-muted hover:text-foreground"
              }`}
            >
              <IconCube />
              Con 3D
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-16 text-center text-foreground-muted text-sm">
          No encontramos platos con esos filtros.
        </div>
      ) : (
        filtered.map((section, i) => (
          <section key={section.id ?? "otros"} className="mt-8 lg:mt-14">
            {i > 0 && (
              <div
                aria-hidden
                className="h-px w-full bg-gradient-to-r from-transparent via-accent/40 to-transparent mb-8 lg:mb-14"
              />
            )}
            <div className="flex items-baseline justify-between mb-4 lg:mb-6">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="hidden sm:inline-block w-6 h-px bg-accent"
                />
                <h2 className="text-lg lg:text-2xl font-medium text-foreground">
                  {section.name}
                </h2>
              </div>
              <span className="text-xs lg:text-sm text-foreground-dim">
                {section.dishes.length}{" "}
                {section.dishes.length === 1 ? "plato" : "platos"}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
              {section.dishes.map((dish) => (
                <Link
                  key={dish.id}
                  href={`/menu/${dish.id}`}
                  className="group relative rounded-xl border border-border overflow-hidden hover:border-border-strong transition-colors"
                >
                  <div className="relative aspect-square bg-background-panel">
                    {dish.thumbnail_url ? (
                      <Image
                        src={dish.thumbnail_url}
                        alt={dish.name}
                        fill
                        sizes="(min-width: 640px) 33vw, 50vw"
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-foreground-dim text-xs">
                        Sin imagen
                      </div>
                    )}
                    {dish.has_model && (
                      <div className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/70 backdrop-blur-sm border border-accent/40 px-2 py-0.5 text-[9px] tracking-[0.1em] text-accent">
                        <IconCube />
                        3D
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm text-foreground font-medium leading-tight">
                      {dish.name}
                    </p>
                    <p className="text-sm text-accent mt-1">
                      {dish.price_display}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))
      )}

      {(query || only3D || activeCat !== ALL) && filtered.length > 0 && (
        <p className="mt-6 text-center text-xs text-foreground-dim">
          {totalFound} {totalFound === 1 ? "resultado" : "resultados"}
        </p>
      )}
    </>
  );
}

function CatChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs whitespace-nowrap transition-colors ${
        active
          ? "bg-accent text-black font-medium"
          : "bg-background-elevated border border-border text-foreground-muted hover:text-foreground hover:border-border-strong"
      }`}
    >
      {label}
    </button>
  );
}

function IconCube() {
  return (
    <svg
      aria-hidden
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}
