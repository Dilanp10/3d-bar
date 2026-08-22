import { AuthRequiredError } from "@/lib/auth/require-admin";

const DEFAULT_MESSAGE = "Ocurrió un error. Volvé a intentar.";

function messageOf(error: unknown): string {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    const m = (error as { message: unknown }).message;
    if (typeof m === "string") return m;
  }
  return "";
}

export function sanitizeActionError(error: unknown, fallback = DEFAULT_MESSAGE): string {
  console.error("[action-error]", error);

  if (error instanceof AuthRequiredError) {
    return "Sesión expirada. Refrescá la página.";
  }

  const raw = messageOf(error).toLowerCase();

  if (!raw) return fallback;

  if (raw.includes("foreign key") || raw.includes("violates foreign key constraint")) {
    return "No se puede completar: hay datos relacionados que dependen de este registro.";
  }
  if (raw.includes("duplicate key") || raw.includes("unique constraint") || raw.includes("already exists")) {
    return "Ya existe un registro con esos datos.";
  }
  if (raw.includes("row-level security") || raw.includes("row level security") || raw.includes("permission denied")) {
    return "No tenés permiso para hacer esto.";
  }
  if (raw.includes("storage") || raw.includes("bucket") || raw.includes("upload")) {
    return "Error al subir el archivo. Volvé a intentar.";
  }
  if (raw.includes("jwt") || raw.includes("unauthorized") || raw.includes("not authenticated")) {
    return "Sesión expirada. Refrescá la página.";
  }

  return fallback;
}
