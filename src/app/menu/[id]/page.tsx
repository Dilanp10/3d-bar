import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getDishById } from "@/lib/db/dishes";
import { DishInfo } from "./DishInfo";
import { DishViewer } from "./DishViewer";
import { InstallPWAButton } from "./InstallPWAButton";
import { TrackView } from "./TrackView";
import { BackButton } from "@/components/BackButton";

type Params = { id: string };
type SearchParams = { preview?: string };

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const { id } = await params;
  const { preview } = await searchParams;
  const dish = await getDishById(id, { activeOnly: preview !== "1" });

  if (!dish) {
    return { title: "Plato no encontrado — 3D Bar" };
  }

  const title = `${dish.name} — 3D Bar`;
  const description =
    dish.description ?? `${dish.name} en la carta del 3D Bar`;
  const image = dish.photo_url ?? undefined;
  const url = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/menu/${dish.id}`
    : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: image ? [{ url: image, alt: dish.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function DishPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const { preview } = await searchParams;
  // El link de preview del admin (?preview=1) debe poder ver platos ocultos —
  // es justo el caso de uso principal (confirmar cómo queda antes/después de ocultarlo).
  const dish = await getDishById(id, { activeOnly: preview !== "1" });
  if (!dish) notFound();

  const hasModel = Boolean(dish.model_url);

  return (
    <main className="min-h-dvh flex flex-col">
      <BackButton href="/menu" label="Carta" />
      <section className="relative w-full aspect-square sm:aspect-[4/3] bg-background-panel border-b border-border">
        {hasModel ? (
          <DishViewer
            src={dish.model_url!}
            poster={dish.thumbnail_url ?? dish.photo_url ?? undefined}
            alt={dish.name}
          />
        ) : (
          <div className="absolute inset-0">
            {dish.photo_url ? (
              <Image
                src={dish.photo_url}
                alt={dish.name}
                fill
                sizes="(min-width: 640px) 100vw, 100vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full grid place-items-center text-foreground-dim">
                Sin imagen
              </div>
            )}
            <div className="absolute bottom-4 left-4 right-4 rounded-lg bg-black/60 backdrop-blur border border-border-strong px-4 py-3 text-sm text-accent">
              Modelo 3D próximamente
            </div>
          </div>
        )}
      </section>

      <DishInfo dish={dish} />

      <InstallPWAButton />
      <TrackView dishId={dish.id} />
    </main>
  );
}
