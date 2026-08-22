import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getPublicMenu } from "@/lib/db/menu";
import { formatPrice } from "@/lib/formatting/price";

export function generateMetadata(): Metadata {
  const title = "Carta — Bar Sharif";
  const description = "Todos los platos del Bar Sharif, en 3D.";
  const url = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/menu`
    : undefined;

  return {
    title,
    description,
    openGraph: { title, description, url, type: "website" },
    twitter: { card: "summary", title, description },
  };
}

export default async function MenuPage() {
  const sections = await getPublicMenu();

  if (sections.length === 0) {
    return (
      <main className="min-h-dvh grid place-items-center px-6 text-center">
        <div className="max-w-sm flex flex-col items-center gap-4">
          <span className="text-xs uppercase tracking-[0.3em] text-accent">
            Bar Sharif
          </span>
          <p className="text-foreground-muted leading-relaxed">
            La carta está siendo armada. Volvé más tarde.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh px-5 sm:px-8 py-8 max-w-3xl mx-auto w-full">
      <header className="mb-8">
        <span className="text-xs uppercase tracking-[0.3em] text-accent">
          Bar Sharif
        </span>
        <h1 className="text-3xl sm:text-4xl font-semibold text-foreground mt-2">
          Carta
        </h1>
      </header>

      {sections.map((section) => (
        <section key={section.id ?? "otros"} className="mb-10">
          <h2 className="text-lg font-medium text-foreground mb-4">
            {section.name}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {section.dishes.map((dish) => (
              <Link
                key={dish.id}
                href={`/menu/${dish.id}`}
                className="group rounded-xl border border-border overflow-hidden hover:border-border-strong transition-colors"
              >
                <div className="relative aspect-square bg-background-panel">
                  {dish.thumbnail_url ? (
                    <Image
                      src={dish.thumbnail_url}
                      alt={dish.name}
                      fill
                      sizes="(min-width: 640px) 33vw, 50vw"
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-foreground-dim text-xs">
                      Sin imagen
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm text-foreground font-medium leading-tight">
                    {dish.name}
                  </p>
                  <p className="text-sm text-accent mt-1">
                    {formatPrice(dish.price)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
