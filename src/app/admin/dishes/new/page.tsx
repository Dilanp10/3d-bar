import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DishForm } from "../DishForm";
import { createDish } from "../actions";

export default async function NewDishPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("sort_order");

  return (
    <div>
      <Link
        href="/admin/dishes"
        className="text-sm text-foreground-muted hover:text-foreground transition-colors"
      >
        &larr; Volver
      </Link>
      <h1 className="text-2xl font-semibold text-foreground mt-3 mb-6">
        Nuevo plato
      </h1>
      <DishForm categories={categories ?? []} action={createDish} />
    </div>
  );
}
