import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getDishById } from "@/lib/db/dishes";
import { DishInfo } from "./DishInfo";
import { DishViewer } from "./DishViewer";
import { InstallPWAButton } from "./InstallPWAButton";
import { TrackView } from "./TrackView";

type Params = { id: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const dish = await getDishById(id);

  if (!dish) {
    return { title: "Plato no encontrado — Bar Sharif" };
  }

  const title = `${dish.name} — Bar Sharif`;
  const description =
    dish.description ?? `${dish.name} en la carta del Bar Sharif`;
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
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const dish = await getDishById(id);
  if (!dish) notFound();

  const hasModel = Boolean(dish.model_url);

  return (
    <main className="min-h-dvh flex flex-col">
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
