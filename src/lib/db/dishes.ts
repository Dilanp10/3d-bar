import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type Dish = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string | null;
  photo_url: string | null;
  model_url: string | null;
  thumbnail_url: string | null;
  sort_order: number;
  active: boolean;
  created_at: string;
  category: { name: string } | null;
};

const uuidSchema = z.string().uuid();

export async function getDishById(
  id: string,
  { activeOnly = true }: { activeOnly?: boolean } = {},
): Promise<Dish | null> {
  const parsed = uuidSchema.safeParse(id);
  if (!parsed.success) return null;

  const supabase = await createClient();

  let query = supabase
    .from("dishes")
    .select(
      "id, name, description, price, category_id, photo_url, model_url, thumbnail_url, sort_order, active, created_at, category:categories(name)",
    )
    .eq("id", parsed.data);

  if (activeOnly) {
    query = query.eq("active", true);
  }

  const { data, error } = await query.maybeSingle();

  if (error || !data) return null;

  const category = Array.isArray(data.category)
    ? (data.category[0] ?? null)
    : (data.category ?? null);

  return { ...data, price: Number(data.price), category } as Dish;
}
