import type { Metadata } from "next";
import Link from "next/link";
import { getPublicMenu } from "@/lib/db/menu";
import { MenuFilters } from "./MenuFilters";
import { VitrinaMenu } from "./VitrinaMenu";
import { BackButton } from "@/components/BackButton";

export function generateMetadata(): Metadata {
  const title = "Carta — 3D Bar";
  const description = "Todos los platos del 3D Bar, en 3D.";
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

type SP = Promise<{ view?: string }>;

export default async function MenuPage({
  searchParams,
}: {
  searchParams: SP;
}) {
  const { view } = await searchParams;
  const asList = view === "list";
  const sections = await getPublicMenu();

  if (sections.length === 0) {
    return (
      <>
        <BackButton href="/" label="Inicio" />
        <main className="min-h-dvh grid place-items-center px-6 text-center">
          <div className="max-w-sm flex flex-col items-center gap-4">
            <span className="text-xs uppercase tracking-[0.3em] text-accent">
              3D Bar
            </span>
            <p className="text-foreground-muted leading-relaxed">
              La carta está siendo armada. Volvé más tarde.
            </p>
          </div>
        </main>
      </>
    );
  }

  if (asList) {
    return (
      <>
        <BackButton href="/" label="Inicio" />
        <main className="min-h-dvh px-5 sm:px-8 lg:px-12 py-6 lg:py-10 max-w-6xl mx-auto w-full">
          <header className="mb-5 lg:mb-8 flex items-end justify-between gap-4">
            <div>
              <span className="text-xs uppercase tracking-[0.3em] text-accent">
                3D Bar
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground mt-2">
                Carta
              </h1>
            </div>
            <Link
              href="/menu"
              className="text-[11px] uppercase tracking-[0.22em] text-foreground-dim hover:text-foreground-muted transition-colors"
            >
              Ver vitrina 3D
            </Link>
          </header>

          <MenuFilters sections={sections} />
        </main>
      </>
    );
  }

  return (
    <>
      <BackButton href="/" label="Inicio" />
      <main className="min-h-dvh flex flex-col">
        <header className="pt-6 pb-2 px-6 text-center max-w-6xl mx-auto w-full">
          <span className="text-[10px] uppercase tracking-[0.32em] text-accent">
            3D Bar
          </span>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mt-1.5">
            La carta
          </h1>
        </header>

        <VitrinaMenu sections={sections} />
      </main>
    </>
  );
}
