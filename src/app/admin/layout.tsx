import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
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

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <nav className="border-b border-border bg-background-elevated">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-6">
          <Link
            href="/admin"
            className="text-sm font-semibold text-accent tracking-wide"
          >
            Sharif Admin
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/admin/dishes"
              className="text-foreground-muted hover:text-foreground transition-colors"
            >
              Platos
            </Link>
            <Link
              href="/admin/categories"
              className="text-foreground-muted hover:text-foreground transition-colors"
            >
              Categorías
            </Link>
          </div>
          <div className="ml-auto">
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
