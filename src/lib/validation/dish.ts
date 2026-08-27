import { z } from "zod";

// Validación server-side de los campos de plato y categoría. El browser ya los
// valida (required/type=number), pero estas actions no deben depender solo de
// eso: acá está la barrera real (FR-002 de M12).

const emptyToNull = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? null : v;

// Distinto de emptyToNull: acá un vacío/ausente debe seguir siendo inválido
// (no puede coercionarse a 0 en silencio), así que lo mandamos a `undefined`
// para que z.coerce.number() lo vea como NaN y falle con el mensaje custom.
const emptyToUndefined = (v: unknown) =>
  v == null || (typeof v === "string" && v.trim() === "") ? undefined : v;

export const dishSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  description: z.preprocess(
    emptyToNull,
    z.string().trim().max(2000).nullable(),
  ),
  price: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ message: "El precio debe ser un número" })
      .finite("El precio debe ser un número")
      .min(0, "El precio no puede ser negativo"),
  ),
  category_id: z.preprocess(emptyToNull, z.string().uuid().nullable()),
  sort_order: z.coerce.number().int().min(0).catch(0),
  active: z.boolean(),
});

export type DishInput = z.infer<typeof dishSchema>;

export const categorySchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  sort_order: z.coerce.number().int().min(0).catch(0),
});

export type CategoryInput = z.infer<typeof categorySchema>;

// Helpers que arman el objeto crudo desde el FormData (mismo mapeo que ya usaban
// las actions) para pasarlo a los esquemas de arriba.
export function dishInputFromForm(formData: FormData) {
  return {
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
    category_id: formData.get("category_id"),
    sort_order: formData.get("sort_order") ?? "0",
    active: formData.get("active") === "on",
  };
}

export function categoryInputFromForm(formData: FormData) {
  return {
    name: formData.get("name"),
    sort_order: formData.get("sort_order") ?? "0",
  };
}

// Toma el primer mensaje de error legible de un ZodError.
export function firstZodMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Datos inválidos.";
}
