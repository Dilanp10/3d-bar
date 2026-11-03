// Avisa si el allowlist del panel no está configurado. `isAdminEmail` falla
// *abierto* cuando ADMIN_EMAIL no está seteada (cualquier usuario autenticado
// entra), así que el único síntoma visible es este cartel.
//
// Reemplaza al viejo SignupsWarning, que para saber si los sign-ups estaban
// abiertos hacía un `auth.signUp` real en cada render del panel.
export function AdminEmailWarning() {
  if (process.env.ADMIN_EMAIL?.trim()) return null;

  return (
    <div className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
      <p className="font-medium text-amber-300">
        ⚠️ ADMIN_EMAIL no está configurada
      </p>
      <p className="mt-1 text-amber-200/90">
        Sin esa variable, cualquier usuario autenticado puede entrar a este
        panel. La base igual le bloquea las escrituras (las policies de RLS
        exigen el email del admin), pero el panel no filtra nada. Setear{" "}
        <strong>ADMIN_EMAIL</strong> con el mismo email que usa la función{" "}
        <code>public.is_admin()</code> en Supabase.
      </p>
    </div>
  );
}
