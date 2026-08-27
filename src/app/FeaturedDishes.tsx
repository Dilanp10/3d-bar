import Link from "next/link";
import Image from "next/image";
import { getPublicMenu } from "@/lib/db/menu";
import { formatPrice } from "@/lib/formatting/price";

export async function FeaturedDishes() {
  const sections = await getPublicMenu();
  // Destacados: el postre estrella (categoría "Postres") va primero; el resto
  // mantiene el orden de la carta. /menu usa getPublicMenu por su cuenta, así
  // que su orden (Entradas → Principales → Tragos → Postres) no se ve afectado.
  const featuredWeight = (name: string) => (name === "Postres" ? 0 : 1);
  const dishes = [...sections]
    .sort((a, b) => featuredWeight(a.name) - featuredWeight(b.name))
    .flatMap((s) => s.dishes)
    .slice(0, 4);

  if (dishes.length === 0) return null;

  return (
    <section className="relative px-6 sm:px-10 lg:px-16 py-20 sm:py-28 max-w-6xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-10 sm:mb-12 gap-4">
        <div>
          <span className="text-[11px] uppercase tracking-[0.25em] text-accent-dim">
            De la carta
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground mt-3 leading-tight">
            Platos destacados
          </h2>
        </div>
        <Link
          href="/menu"
          className="group inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent-hover transition-colors whitespace-nowrap self-start sm:self-end pb-1"
        >
          Ver la carta completa
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform">
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {dishes.map((dish) => (
          <Link
            key={dish.id}
            href={`/menu/${dish.id}`}
            className="group relative rounded-2xl overflow-hidden bg-background-panel border border-border hover:border-border-strong transition-all duration-300 hover:-translate-y-1"
          >
            <div className="relative aspect-[4/5]">
              {dish.thumbnail_url ? (
                <Image
                  src={dish.thumbnail_url}
                  alt={dish.name}
                  fill
                  sizes="(min-width: 1024px) 22vw, 50vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
              ) : (
                <div className="w-full h-full grid place-items-center text-foreground-dim text-xs">
                  Sin imagen
                </div>
              )}
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"
              />

              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="text-sm sm:text-base font-medium text-white leading-tight line-clamp-2">
                  {dish.name}
                </p>
                <p className="text-sm font-semibold text-accent mt-1.5">
                  {formatPrice(dish.price)}
                </p>
              </div>

              <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                  <path d="M7 17L17 7M17 7H8M17 7V16" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
