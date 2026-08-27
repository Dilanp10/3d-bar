"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { sanitizeActionError } from "@/lib/errors/sanitize";
import { removeStorageObjects } from "@/lib/storage/paths";
import { getDishById } from "@/lib/db/dishes";
import { dishSchema, dishInputFromForm, firstZodMessage } from "@/lib/validation/dish";

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

  const photoFile = formData.get("photo") as File | null;
  const modelUrl = (formData.get("model_url") as string) || null;

  const parsed = dishSchema.safeParse(dishInputFromForm(formData));
  if (!parsed.success) {
    // El .glb ya subido client-side quedaría huérfano si abortamos acá.
    await removeStorageObjects(supabase, [modelUrl]);
    return { error: firstZodMessage(parsed.error) };
  }
  const data = parsed.data;

  let photoUrl: string | null = null;

  if (photoFile && photoFile.size > 0) {
    try {
      photoUrl = await uploadFile(supabase, "photos", photoFile, "dishes");
    } catch (e) {
      // El .glb ya subido client-side quedaría huérfano si abortamos acá.
      await removeStorageObjects(supabase, [modelUrl]);
      return { error: sanitizeActionError(e) };
    }
  }

  const { error } = await supabase.from("dishes").insert({
    name: data.name,
    description: data.description,
    price: data.price,
    category_id: data.category_id,
    sort_order: data.sort_order,
    active: data.active,
    photo_url: photoUrl,
    model_url: modelUrl,
  });

  if (error) {
    // La fila no se creó: borramos los objetos recién subidos (foto server-side
    // + .glb client-side) para no dejar huérfanos.
    await removeStorageObjects(supabase, [photoUrl, modelUrl]);
    return { error: sanitizeActionError(error) };
  }

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

  const modelUrl = (formData.get("model_url") as string) || null;

  const parsed = dishSchema.safeParse(dishInputFromForm(formData));
  if (!parsed.success) {
    // El .glb ya subido client-side quedaría huérfano si abortamos acá.
    await removeStorageObjects(supabase, [modelUrl]);
    return { error: firstZodMessage(parsed.error) };
  }
  const data = parsed.data;

  const current = await getDishById(id, { activeOnly: false });
  const oldPhotoUrl = current?.photo_url ?? null;
  const oldModelUrl = current?.model_url ?? null;

  const updates: Record<string, unknown> = {
    name: data.name,
    description: data.description,
    price: data.price,
    category_id: data.category_id,
    sort_order: data.sort_order,
    active: data.active,
  };

  const photoFile = formData.get("photo") as File | null;
  const removePhoto = formData.get("remove_photo") === "on";
  const removeModel = formData.get("remove_model") === "on";

  // Precedencia: un archivo nuevo siempre gana sobre el checkbox de "quitar".
  let newPhotoUrl: string | null = null;
  if (photoFile && photoFile.size > 0) {
    try {
      newPhotoUrl = await uploadFile(supabase, "photos", photoFile, "dishes");
      updates.photo_url = newPhotoUrl;
    } catch (e) {
      await removeStorageObjects(supabase, [modelUrl]);
      return { error: sanitizeActionError(e) };
    }
  } else if (removePhoto) {
    updates.photo_url = null;
  }

  if (modelUrl) {
    updates.model_url = modelUrl;
  } else if (removeModel) {
    updates.model_url = null;
  }

  const { error } = await supabase.from("dishes").update(updates).eq("id", id);

  if (error) {
    // El update falló: borramos lo recién subido en este submit.
    await removeStorageObjects(supabase, [newPhotoUrl, modelUrl]);
    return { error: sanitizeActionError(error) };
  }

  // Éxito: limpiamos los objetos viejos que dejaron de estar referenciados
  // (reemplazo o quita). Best-effort — no revierte el update.
  const toRemove: (string | null)[] = [];
  if ("photo_url" in updates && oldPhotoUrl && oldPhotoUrl !== updates.photo_url) {
    toRemove.push(oldPhotoUrl);
  }
  if ("model_url" in updates && oldModelUrl && oldModelUrl !== updates.model_url) {
    toRemove.push(oldModelUrl);
  }
  await removeStorageObjects(supabase, toRemove);

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

  // Capturamos las URLs antes de borrar la fila para poder limpiar Storage.
  const current = await getDishById(id, { activeOnly: false });

  const { error } = await supabase.from("dishes").delete().eq("id", id);

  if (error) return { error: sanitizeActionError(error) };

  if (current) {
    await removeStorageObjects(supabase, [
      current.photo_url,
      current.model_url,
      current.thumbnail_url,
    ]);
  }

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
