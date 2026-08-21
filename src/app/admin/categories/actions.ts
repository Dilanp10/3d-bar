"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createCategory(formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;
  const sortOrder = Number(formData.get("sort_order") || "0");

  const { error } = await supabase
    .from("categories")
    .insert({ name, sort_order: sortOrder });

  if (error) return { error: error.message };

  revalidatePath("/admin/categories");
  revalidatePath("/admin/dishes");
}

export async function updateCategory(id: string, formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;
  const sortOrder = Number(formData.get("sort_order") || "0");

  const { error } = await supabase
    .from("categories")
    .update({ name, sort_order: sortOrder })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/categories");
  revalidatePath("/admin/dishes");
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/categories");
  revalidatePath("/admin/dishes");
}
