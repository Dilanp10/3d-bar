import Link from "next/link";
import Image from "next/image";
import { getPublicMenu } from "@/lib/db/menu";
import { formatPrice } from "@/lib/formatting/price";

export async function FeaturedDishes() {
  const sections = await getPublicMenu();
  const dishes = sections.flatMap((s) => s.dishes).slice(0, 4);

  if (dishes.length === 0) return null;

  return (
    <section className="px-5 sm:px-8 py-10 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-foreground">Platos destacados</h2>
        <Link
          href="/menu"
          className="text-sm text-accent hover:text-accent-hover transition-colors"
        >
          Ver todo
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {dishes.map((dish) => (
          <Link
            key={dish.id}
            href={`/menu/${dish.id}`}
            className="group rounded-xl border border-border overflow-hidden hover:border-border-strong transition-colors"
          >
            <div className="relative aspect-square bg-background-panel">
              {dish.thumbnail_url ? (
                <Image
                  src={dish.thumbnail_url}
                  alt={dish.name}
                  fill
                  sizes="(min-width: 640px) 25vw, 50vw"
                  className="object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full grid place-items-center text-foreground-dim text-xs">
                  Sin imagen
                </div>
              )}
            </div>
            <div className="p-3">
              <p className="text-sm text-foreground font-medium leading-tight">
                {dish.name}
              </p>
              <p className="text-sm text-accent mt-1">{formatPrice(dish.price)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
