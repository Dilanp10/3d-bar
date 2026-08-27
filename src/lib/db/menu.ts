import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/formatting/price";

export type MenuDish = {
  id: string;
  name: string;
  price: number;
  price_display: string;
  thumbnail_url: string | null;
  has_model: boolean;
};

export type MenuSection = {
  id: string | null;
  name: string;
  dishes: MenuDish[];
};

export async function getPublicMenu(): Promise<MenuSection[]> {
  const supabase = await createClient();

  const [categoriesRes, dishesRes] = await Promise.all([
    supabase.from("categories").select("id, name").order("sort_order"),
    supabase
      .from("dishes")
      .select("id, name, price, category_id, thumbnail_url, photo_url, model_url")
      .eq("active", true)
      .order("sort_order"),
  ]);

  const categories = categoriesRes.data ?? [];
  const dishes = dishesRes.data ?? [];

  const sections: MenuSection[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    dishes: [],
  }));

  const byId = new Map(sections.map((s) => [s.id, s]));
  const others: MenuDish[] = [];

  for (const d of dishes) {
    const price = Number(d.price);
    const item: MenuDish = {
      id: d.id,
      name: d.name,
      price,
      price_display: formatPrice(price),
      thumbnail_url: d.thumbnail_url ?? d.photo_url ?? null,
      has_model: Boolean(d.model_url),
    };
    const section = d.category_id ? byId.get(d.category_id) : undefined;
    if (section) {
      section.dishes.push(item);
    } else {
      others.push(item);
    }
  }

  const nonEmpty = sections.filter((s) => s.dishes.length > 0);
  if (others.length > 0) {
    nonEmpty.push({ id: null, name: "Otros", dishes: others });
  }

  return nonEmpty;
}
