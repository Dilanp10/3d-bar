// Allowlist de un solo admin. Módulo PURO (sin imports de servidor) para poder
// usarse también desde el middleware (edge), que no puede importar next/headers.
//
// Si `ADMIN_EMAIL` está seteada, SOLO ese email es admin (aunque alguien más
// logre autenticarse). Si no está seteada, cae al comportamiento anterior
// (cualquier usuario autenticado) para no bloquear el acceso durante el
// rollout — apenas se configura la env, queda enforced.
export function isAdminEmail(email: string | undefined | null): boolean {
  const allow = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!allow) return true;
  return (email ?? "").trim().toLowerCase() === allow;
}
