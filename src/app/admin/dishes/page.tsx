import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/formatting/price";
import { DishActions } from "./DishActions";

export default async function DishesPage() {
  const supabase = await createClient();

  const { data: dishes } = await supabase
    .from("dishes")
    .select("id, name, price, active, sort_order, category:categories(name)")
    .order("sort_order");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Platos</h1>
        <Link
          href="/admin/dishes/new"
          className="rounded-lg bg-accent text-black font-medium px-4 py-2 text-sm hover:bg-accent-hover transition-colors"
        >
          + Nuevo plato
        </Link>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-background-elevated text-foreground-muted text-left">
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium hidden sm:table-cell">Categoría</th>
              <th className="px-4 py-3 font-medium">Precio</th>
              <th className="px-4 py-3 font-medium text-center">Activo</th>
              <th className="px-4 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {dishes?.map((dish) => {
              const category = Array.isArray(dish.category)
                ? dish.category[0]
                : dish.category;
              return (
                <tr key={dish.id} className="hover:bg-background-elevated/50">
                  <td className="px-4 py-3 text-foreground">{dish.name}</td>
                  <td className="px-4 py-3 text-foreground-muted hidden sm:table-cell">
                    {category?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {formatPrice(Number(dish.price))}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block w-2.5 h-2.5 rounded-full ${dish.active ? "bg-green-500" : "bg-foreground-dim"}`}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DishActions id={dish.id} active={dish.active} />
                  </td>
                </tr>
              );
            })}
            {(!dishes || dishes.length === 0) && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-foreground-dim"
                >
                  No hay platos todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
