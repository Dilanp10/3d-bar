import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./LoginForm";

// Server Component: si ya hay sesión, redirige a /admin (FR-007 / CA-005).
// El middleware ya cubre este caso, pero defensa en profundidad.
export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/admin");

  return (
    <main className="min-h-dvh grid place-items-center px-6">
      <LoginForm />
    </main>
  );
}
