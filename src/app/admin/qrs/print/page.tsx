import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/formatting/price";
import { PrintSheet } from "./PrintSheet";

export default async function PrintQrsPage() {
  const supabase = await createClient();
  const { data: dishes } = await supabase
    .from("dishes")
    .select("id, name, price")
    .eq("active", true)
    .order("sort_order");

  if (!dishes || dishes.length === 0) {
    return (
      <div>
        <Link
          href="/admin/dishes"
          className="text-sm text-foreground-muted hover:text-foreground transition-colors"
        >
          &larr; Volver a platos
        </Link>
        <div className="mt-6 rounded-xl border border-border p-8 text-center text-foreground-muted">
          No hay platos activos para imprimir.
        </div>
      </div>
    );
  }

  const items = dishes.map((d) => ({
    id: d.id,
    name: d.name,
    priceLabel: formatPrice(Number(d.price)),
  }));

  return <PrintSheet items={items} />;
}
