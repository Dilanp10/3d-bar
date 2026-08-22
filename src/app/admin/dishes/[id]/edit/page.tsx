import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDishById } from "@/lib/db/dishes";
import { DishForm } from "../../DishForm";
import { QrBlock } from "../../QrBlock";
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
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-start">
        <DishForm dish={dish} categories={categories ?? []} action={boundUpdate} />
        <aside className="rounded-xl border border-border p-4 lg:sticky lg:top-4">
          <h2 className="text-sm font-medium text-foreground-muted mb-3">
            QR del plato
          </h2>
          <QrBlock dishId={dish.id} dishName={dish.name} size={240} />
        </aside>
      </div>
    </div>
  );
}
