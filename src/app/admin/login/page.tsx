import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth/admin-email";
import { LoginForm } from "./LoginForm";

// Server Component: si ya hay sesión, redirige a /admin (FR-007 / CA-005).
// El middleware ya cubre este caso, pero defensa en profundidad.
export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Mira el allowlist, no solo que haya sesión: con un usuario autenticado
  // fuera del allowlist el middleware rebota /admin hasta acá, y redirigir a
  // /admin de vuelta cierra el loop (ERR_TOO_MANY_REDIRECTS, sin forma de
  // llegar al login para desloguearse).
  if (user && isAdminEmail(user.email)) redirect("/admin");

  return (
    <main className="min-h-dvh grid place-items-center px-6">
      <LoginForm />
    </main>
  );
}
