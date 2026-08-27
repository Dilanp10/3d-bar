import { areSignupsOpen } from "@/lib/auth/signups-status";

export async function SignupsWarning() {
  const open = await areSignupsOpen();
  if (open !== true) return null;

  return (
    <div className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
      <p className="font-medium text-amber-300">
        ⚠️ Los sign-ups de Supabase Auth siguen habilitados
      </p>
      <p className="mt-1 text-amber-200/90">
        Cualquiera podría autoregistrarse — el allowlist de ADMIN_EMAIL le
        bloquea el acceso al panel, pero no achica los permisos de escritura en
        la base (RLS sigue habilitando a cualquier usuario autenticado). Andá
        al dashboard de Supabase → <strong>Authentication → Providers → Email</strong>{" "}
        y desactivá <em>&quot;Allow new users to sign up&quot;</em>.
      </p>
    </div>
  );
}
