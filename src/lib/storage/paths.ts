import type { SupabaseClient } from "@supabase/supabase-js";
import { sanitizeActionError } from "@/lib/errors/sanitize";

// Las URLs públicas de Supabase Storage tienen la forma:
//   https://<proj>.supabase.co/storage/v1/object/public/<bucket>/<path...>
// Este helper extrae { bucket, path } para poder borrar el objeto.
const PUBLIC_MARKER = "/storage/v1/object/public/";

export function storagePathFromPublicUrl(
  url: string | null | undefined,
): { bucket: string; path: string } | null {
  if (!url) return null;
  const idx = url.indexOf(PUBLIC_MARKER);
  if (idx === -1) return null;
  const rest = url.slice(idx + PUBLIC_MARKER.length);
  const slash = rest.indexOf("/");
  if (slash === -1) return null;
  const bucket = rest.slice(0, slash);
  // Sacar querystring/hash si los hubiera y decodificar el path.
  const rawPath = rest.slice(slash + 1).split(/[?#]/)[0];
  if (!bucket || !rawPath) return null;
  return { bucket, path: decodeURIComponent(rawPath) };
}

// Borra best-effort los objetos de Storage referenciados por las URLs dadas.
// Los errores NUNCA se propagan: se loguean server-side y la operación
// principal (delete/update de DB) sigue siendo la fuente de verdad.
export async function removeStorageObjects(
  supabase: SupabaseClient,
  urls: (string | null | undefined)[],
): Promise<void> {
  const byBucket = new Map<string, string[]>();
  for (const url of urls) {
    const loc = storagePathFromPublicUrl(url);
    if (!loc) continue;
    const list = byBucket.get(loc.bucket) ?? [];
    list.push(loc.path);
    byBucket.set(loc.bucket, list);
  }

  for (const [bucket, paths] of byBucket) {
    try {
      const { error } = await supabase.storage.from(bucket).remove(paths);
      if (error) sanitizeActionError(error);
    } catch (e) {
      sanitizeActionError(e);
    }
  }
}
