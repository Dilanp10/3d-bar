import { createClient } from "@/lib/supabase/server";
import { CategoryRow } from "./CategoryRow";
import { NewCategoryForm } from "./NewCategoryForm";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, sort_order")
    .order("sort_order");

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground mb-6">
        Categorías
      </h1>

      <div className="rounded-xl border border-border overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-background-elevated text-foreground-muted text-left">
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium w-24">Orden</th>
              <th className="px-4 py-3 font-medium text-right w-32">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {categories?.map((cat) => (
              <CategoryRow key={cat.id} category={cat} />
            ))}
            {(!categories || categories.length === 0) && (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-8 text-center text-foreground-dim"
                >
                  No hay categorías todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <NewCategoryForm />
    </div>
  );
}
