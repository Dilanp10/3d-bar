"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { sanitizeActionError } from "@/lib/errors/sanitize";

async function uploadFile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  bucket: string,
  file: File,
  prefix: string,
) {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${prefix}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw new Error(`Upload to ${bucket} failed: ${error.message}`);
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);
  return publicUrl;
}

export async function createDish(formData: FormData) {
  const supabase = await createClient();

  try {
    await requireAdmin(supabase);
  } catch (e) {
    return { error: sanitizeActionError(e) };
  }

  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const price = Number(formData.get("price"));
  const categoryId = (formData.get("category_id") as string) || null;
  const sortOrder = Number(formData.get("sort_order") || "0");
  const active = formData.get("active") === "on";

  const photoFile = formData.get("photo") as File | null;
  const modelUrl = (formData.get("model_url") as string) || null;

  let photoUrl: string | null = null;

  if (photoFile && photoFile.size > 0) {
    try {
      photoUrl = await uploadFile(supabase, "photos", photoFile, "dishes");
    } catch (e) {
      return { error: sanitizeActionError(e) };
    }
  }

  const { error } = await supabase.from("dishes").insert({
    name,
    description,
    price,
    category_id: categoryId,
    sort_order: sortOrder,
    active,
    photo_url: photoUrl,
    model_url: modelUrl,
  });

  if (error) return { error: sanitizeActionError(error) };

  revalidatePath("/admin/dishes");
  revalidatePath("/");
  revalidatePath("/menu");
  redirect("/admin/dishes");
}

export async function updateDish(id: string, formData: FormData) {
  const supabase = await createClient();

  try {
    await requireAdmin(supabase);
  } catch (e) {
    return { error: sanitizeActionError(e) };
  }

  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const price = Number(formData.get("price"));
  const categoryId = (formData.get("category_id") as string) || null;
  const sortOrder = Number(formData.get("sort_order") || "0");
  const active = formData.get("active") === "on";

  const updates: Record<string, unknown> = {
    name,
    description,
    price,
    category_id: categoryId,
    sort_order: sortOrder,
    active,
  };

  const photoFile = formData.get("photo") as File | null;
  const modelUrl = formData.get("model_url") as string | null;

  if (photoFile && photoFile.size > 0) {
    try {
      updates.photo_url = await uploadFile(supabase, "photos", photoFile, "dishes");
    } catch (e) {
      return { error: sanitizeActionError(e) };
    }
  }

  if (modelUrl) {
    updates.model_url = modelUrl;
  }

  const { error } = await supabase.from("dishes").update(updates).eq("id", id);

  if (error) return { error: sanitizeActionError(error) };

  revalidatePath("/admin/dishes");
  revalidatePath(`/menu/${id}`);
  revalidatePath("/");
  revalidatePath("/menu");
  redirect("/admin/dishes");
}

export async function deleteDish(id: string) {
  const supabase = await createClient();

  try {
    await requireAdmin(supabase);
  } catch (e) {
    return { error: sanitizeActionError(e) };
  }

  const { error } = await supabase.from("dishes").delete().eq("id", id);

  if (error) return { error: sanitizeActionError(error) };

  revalidatePath("/admin/dishes");
  revalidatePath("/");
  revalidatePath("/menu");
}

export async function toggleDishActive(id: string, active: boolean) {
  const supabase = await createClient();

  try {
    await requireAdmin(supabase);
  } catch (e) {
    return { error: sanitizeActionError(e) };
  }

  const { error } = await supabase
    .from("dishes")
    .update({ active })
    .eq("id", id);

  if (error) return { error: sanitizeActionError(error) };

  revalidatePath("/admin/dishes");
  revalidatePath(`/menu/${id}`);
  revalidatePath("/");
  revalidatePath("/menu");
}
