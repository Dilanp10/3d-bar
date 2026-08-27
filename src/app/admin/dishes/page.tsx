import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DishCard, type AdminDish } from "./DishCard";

const btnPrimary =
  "inline-flex items-center gap-2 rounded-lg bg-accent text-black font-medium px-4 py-2.5 text-sm hover:bg-accent-hover transition-colors min-h-[44px]";
const btnSecondary =
  "inline-flex items-center gap-2 rounded-lg border border-border text-foreground px-4 py-2.5 text-sm hover:bg-background-elevated transition-colors min-h-[44px]";

export default async function DishesPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("dishes")
    .select(
      "id, name, price, active, sort_order, photo_url, thumbnail_url, model_url, category:categories(name)",
    )
    .order("sort_order");

  const dishes: AdminDish[] = (data ?? []).map((d) => {
    const category = Array.isArray(d.category) ? d.category[0] : d.category;
    return {
      id: d.id,
      name: d.name,
      price: Number(d.price),
      active: d.active,
      category_name: category?.name ?? null,
      image_url: d.thumbnail_url ?? d.photo_url ?? null,
      has_model: Boolean(d.model_url),
    };
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Tus platos</h1>
          <p className="text-sm text-foreground-muted mt-0.5">
            {dishes.length > 0
              ? `${dishes.length} plato${dishes.length === 1 ? "" : "s"} en la carta`
              : "Empezá cargando tu primer plato"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dishes.length > 0 && (
            <Link href="/admin/qrs/print" className={btnSecondary}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" />
              </svg>
              Imprimir QRs
            </Link>
          )}
          <Link href="/admin/dishes/new" className={btnPrimary}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nuevo plato
          </Link>
        </div>
      </div>

      {dishes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-strong bg-background-elevated/40 px-6 py-16 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-accent/10 grid place-items-center mb-4">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent" aria-hidden>
              <path d="M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7M12 11v10" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            Todavía no cargaste ningún plato
          </h2>
          <p className="text-sm text-foreground-muted mt-1 max-w-sm mx-auto">
            Tocá <strong className="text-foreground">Nuevo plato</strong> para
            cargar el primero con su foto y, si querés, su modelo 3D.
          </p>
          <Link href="/admin/dishes/new" className={`${btnPrimary} mt-6`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nuevo plato
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {dishes.map((dish) => (
            <DishCard key={dish.id} dish={dish} />
          ))}
        </div>
      )}
    </div>
  );
}
