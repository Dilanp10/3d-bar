import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/middleware";

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

  if (!user && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  if (user && isLoginPage) {
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
