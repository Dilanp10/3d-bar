"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth/admin-email";

const GENERIC_ERROR = "Email o contraseña incorrectos";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type SignInState = { error: string } | null;

// Nunca devolver el mensaje literal de Supabase (leak de info: distingue
// "usuario no existe" vs "password incorrecto" vs "email not confirmed").
// FR-005 / CA-003: siempre un único string genérico.
export async function signIn(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: GENERIC_ERROR };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: GENERIC_ERROR };
  }

  // Allowlist de un solo admin: si el email no es el admin permitido, no se lo
  // deja entrar (se cierra la sesión recién abierta). Mismo mensaje genérico.
  if (!isAdminEmail(data.user?.email)) {
    await supabase.auth.signOut();
    return { error: GENERIC_ERROR };
  }

  redirect("/admin");
}
