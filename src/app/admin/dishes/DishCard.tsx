import Image from "next/image";
import { formatPrice } from "@/lib/formatting/price";
import { DishActions } from "./DishActions";

export type AdminDish = {
  id: string;
  name: string;
  price: number;
  active: boolean;
  category_name: string | null;
  image_url: string | null;
  has_model: boolean;
};

export function DishCard({ dish }: { dish: AdminDish }) {
  return (
    <article className="flex flex-col rounded-2xl border border-border bg-background-elevated overflow-hidden">
      {/* Imagen: toca para ver la página pública (no cuenta como visita) */}
      <a
        href={`/menu/${dish.id}?preview=1`}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block aspect-[4/3] bg-background-panel"
        title="Ver cómo lo ve el cliente"
      >
        {dish.image_url ? (
          <Image
            src={dish.image_url}
            alt={dish.name}
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-foreground-dim text-sm">
            Sin foto
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              dish.active
                ? "bg-green-500/20 text-green-300 border border-green-500/30"
                : "bg-black/60 text-foreground-muted border border-border"
            }`}
          >
            {dish.active ? "Activo" : "Oculto"}
          </span>
          {dish.has_model && (
            <span className="rounded-full px-2.5 py-1 text-xs font-medium bg-accent/20 text-accent border border-accent/30">
              3D
            </span>
          )}
        </div>
      </a>

      {/* Info */}
      <div className="flex flex-col gap-1 p-4">
        <h2 className="text-base font-semibold text-foreground leading-tight">
          {dish.name}
        </h2>
        <div className="flex items-center justify-between">
          <span className="text-accent font-semibold">
            {formatPrice(dish.price)}
          </span>
          <span className="text-xs text-foreground-dim">
            {dish.category_name ?? "Sin categoría"}
          </span>
        </div>
      </div>

      {/* Acciones */}
      <div className="mt-auto p-4 pt-0">
        <DishActions id={dish.id} name={dish.name} active={dish.active} />
      </div>
    </article>
  );
}
