import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth/admin-email";
import { LogoutButton } from "./LogoutButton";
import { SignupsWarning } from "./SignupsWarning";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Defense-in-depth: si el middleware fallara, este chequeo debe honrar el
  // mismo allowlist (ADMIN_EMAIL) que middleware/requireAdmin/login, no solo
  // "hay sesión".
  if (!user || !isAdminEmail(user.email)) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <nav className="border-b border-border bg-background-elevated">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4 sm:gap-6">
          <Link
            href="/admin"
            className="text-sm font-semibold text-accent tracking-wide shrink-0"
          >
            3D Bar
          </Link>
          <div className="flex items-center gap-1 sm:gap-2 text-sm overflow-x-auto">
            <Link
              href="/admin/dishes"
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-foreground-muted hover:text-foreground hover:bg-background-panel transition-colors"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7" />
              </svg>
              Platos
            </Link>
            <Link
              href="/admin/categories"
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-foreground-muted hover:text-foreground hover:bg-background-panel transition-colors"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M3 4h18M3 12h18M3 20h18" />
              </svg>
              Categorías
            </Link>
            <Link
              href="/admin/analytics"
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-foreground-muted hover:text-foreground hover:bg-background-panel transition-colors"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M3 3v18h18M8 15v3M13 11v7M18 7v11" />
              </svg>
              Visitas
            </Link>
          </div>
          <div className="ml-auto shrink-0">
            <LogoutButton />
          </div>
        </div>
      </nav>
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6">
        <SignupsWarning />
        {children}
      </main>
    </div>
  );
}
