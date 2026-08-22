import { BUSINESS_NAME } from "@/lib/content/business-info";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative mt-8 border-t border-border">
      <div className="max-w-5xl mx-auto px-6 sm:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-foreground-dim">
        <p>
          © {year} {BUSINESS_NAME}. La carta en 3D.
        </p>
        <a
          href="/admin"
          className="text-foreground-dim hover:text-accent transition-colors"
        >
          Panel admin
        </a>
      </div>
    </footer>
  );
}
