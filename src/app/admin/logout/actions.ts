"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// FR-003 / FR-008 / CA-004: revoca la sesión (Supabase borra la cookie
// vía Set-Cookie con Max-Age=0). Redirige a la landing pública `/`
// (cambio pedido en M13: "Salir" lleva a la página principal, no al login).
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
