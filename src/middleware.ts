import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/middleware";
import { isAdminEmail } from "@/lib/auth/admin-email";

// Middleware de Next: refresca la sesión en cada request a /admin/*
// y protege las rutas privadas. La lógica de cookies vive en el helper
// `lib/supabase/middleware` (patrón oficial de @supabase/ssr).
export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);

  // getUser (NO getSession): valida el token contra el servidor de Supabase,
  // no se puede burlar con cookies falsificadas.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isLoginPage = path === "/admin/login";

  // Un usuario autenticado que NO está en el allowlist (ADMIN_EMAIL) se trata
  // como no-admin: no accede al panel y tampoco se lo redirige desde el login
  // (evita el loop login↔admin).
  const isAdmin = Boolean(user) && isAdminEmail(user?.email);

  if (!isAdmin && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  if (isAdmin && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  return response();
}

// Matcher: solo /admin/*. Todas las rutas públicas (`/`, `/menu/[id]`,
// `/manifest.webmanifest`, `/sw.js`, `/icons/*`, `/_next/*`) quedan fuera
// del middleware y siguen accesibles sin sesión (CA-009).
export const config = {
  matcher: ["/admin/:path*"],
};
