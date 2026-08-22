"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { sanitizeActionError } from "@/lib/errors/sanitize";

export async function createCategory(formData: FormData) {
  const supabase = await createClient();

  try {
    await requireAdmin(supabase);
  } catch (e) {
    return { error: sanitizeActionError(e) };
  }

  const name = formData.get("name") as string;
  const sortOrder = Number(formData.get("sort_order") || "0");

  const { error } = await supabase
    .from("categories")
    .insert({ name, sort_order: sortOrder });

  if (error) return { error: sanitizeActionError(error) };

  revalidatePath("/admin/categories");
  revalidatePath("/admin/dishes");
  revalidatePath("/menu");
}

export async function updateCategory(id: string, formData: FormData) {
  const supabase = await createClient();

  try {
    await requireAdmin(supabase);
  } catch (e) {
    return { error: sanitizeActionError(e) };
  }

  const name = formData.get("name") as string;
  const sortOrder = Number(formData.get("sort_order") || "0");

  const { error } = await supabase
    .from("categories")
    .update({ name, sort_order: sortOrder })
    .eq("id", id);

  if (error) return { error: sanitizeActionError(error) };

  revalidatePath("/admin/categories");
  revalidatePath("/admin/dishes");
  revalidatePath("/menu");
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();

  try {
    await requireAdmin(supabase);
  } catch (e) {
    return { error: sanitizeActionError(e) };
  }

  const { count, error: countError } = await supabase
    .from("dishes")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);

  if (countError) return { error: sanitizeActionError(countError) };
  if ((count ?? 0) > 0) {
    return {
      error: `No se puede borrar: hay ${count} plato${count === 1 ? "" : "s"} usando esta categoría. Cambiales la categoría antes.`,
    };
  }

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id);

  if (error) return { error: sanitizeActionError(error) };

  revalidatePath("/admin/categories");
  revalidatePath("/admin/dishes");
  revalidatePath("/menu");
}
