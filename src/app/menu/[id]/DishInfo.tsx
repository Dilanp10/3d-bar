import type { Dish } from "@/lib/db/dishes";
import { formatPrice } from "@/lib/formatting/price";

export function DishInfo({ dish }: { dish: Dish }) {
  return (
    <section className="flex-1 px-5 sm:px-8 py-6 sm:py-8 max-w-2xl mx-auto w-full">
      <header className="flex flex-col gap-2">
        {dish.category?.name ? (
          <span className="inline-block text-xs uppercase tracking-widest text-accent">
            {dish.category.name}
          </span>
        ) : null}
        <h1 className="text-3xl sm:text-4xl font-semibold leading-tight text-foreground">
          {dish.name}
        </h1>
      </header>

      {dish.description ? (
        <p className="mt-5 text-base leading-relaxed text-foreground-muted">
          {dish.description}
        </p>
      ) : null}

      <div className="mt-8 pt-6 border-t border-border flex items-baseline justify-between gap-4">
        <span className="text-[10px] uppercase tracking-[0.3em] text-foreground-dim">
          Precio
        </span>
        <p
          className="text-3xl sm:text-4xl font-semibold text-accent tabular-nums"
          aria-label={`Precio: ${formatPrice(dish.price)}`}
        >
          {formatPrice(dish.price)}
        </p>
      </div>
    </section>
  );
}
