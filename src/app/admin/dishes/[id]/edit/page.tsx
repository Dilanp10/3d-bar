import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDishById } from "@/lib/db/dishes";
import { DishForm } from "../../DishForm";
import { updateDish } from "../../actions";

export default async function EditDishPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dish = await getDishById(id, { activeOnly: false });
  if (!dish) notFound();

  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("sort_order");

  const boundUpdate = async (formData: FormData) => {
    "use server";
    return updateDish(id, formData);
  };

  return (
    <div>
      <Link
        href="/admin/dishes"
        className="text-sm text-foreground-muted hover:text-foreground transition-colors"
      >
        &larr; Volver
      </Link>
      <h1 className="text-2xl font-semibold text-foreground mt-3 mb-6">
        Editar: {dish.name}
      </h1>
      <DishForm dish={dish} categories={categories ?? []} action={boundUpdate} />
    </div>
  );
}
