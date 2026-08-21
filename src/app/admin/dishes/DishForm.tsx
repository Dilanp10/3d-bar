"use client";

import { useState, useRef } from "react";
import type { Dish } from "@/lib/db/dishes";
import { createClient } from "@/lib/supabase/client";

type Category = { id: string; name: string };

type Props = {
  dish?: Dish;
  categories: Category[];
  action: (formData: FormData) => Promise<{ error: string } | undefined>;
};

type Status =
  | { step: "idle" }
  | { step: "optimizing" }
  | { step: "uploading" }
  | { step: "saving" }
  | { step: "error"; message: string };

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const WARNING_SIZE = 15 * 1024 * 1024;

export function DishForm({ dish, categories, action }: Props) {
  const [status, setStatus] = useState<Status>({ step: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [sizeWarning, setSizeWarning] = useState<string | null>(null);
  const [sizeInfo, setSizeInfo] = useState<{ original: number; optimized: number } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const busy = status.step !== "idle" && status.step !== "error";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSizeWarning(null);
    setSizeInfo(null);

    const form = formRef.current!;
    const formData = new FormData(form);

    const modelInput = form.querySelector<HTMLInputElement>('input[name="model"]');
    const modelFile = modelInput?.files?.[0];

    if (modelFile && modelFile.size > 0) {
      setStatus({ step: "optimizing" });

      try {
        const { optimizeGlb } = await import("@/lib/glb/optimize");
        const result = await optimizeGlb(modelFile);

        setSizeInfo({ original: result.originalSize, optimized: result.optimizedSize });

        if (result.optimizedSize > WARNING_SIZE) {
          setSizeWarning(
            `El modelo sigue pesando ${formatBytes(result.optimizedSize)}, puede tardar en cargar en 4G.`,
          );
        }

        setStatus({ step: "uploading" });

        const supabase = createClient();
        const path = `dishes/${Date.now()}.glb`;
        const { error: uploadError } = await supabase.storage
          .from("models")
          .upload(path, result.file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          setStatus({ step: "error", message: `Error subiendo modelo: ${uploadError.message}` });
          setError(`Error subiendo modelo: ${uploadError.message}`);
          return;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("models").getPublicUrl(path);

        formData.set("model_url", publicUrl);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error procesando el modelo 3D.";
        setStatus({ step: "error", message: msg });
        setError(msg);
        return;
      }
    }

    formData.delete("model");

    setStatus({ step: "saving" });

    try {
      const result = await action(formData);
      if (result?.error) {
        setStatus({ step: "error", message: result.error });
        setError(result.error);
      }
    } catch {
      // redirect() from Server Action throws — this is expected on success
    }
  }

  const statusLabel =
    status.step === "optimizing"
      ? "Optimizando modelo 3D…"
      : status.step === "uploading"
        ? "Subiendo modelo…"
        : status.step === "saving"
          ? "Guardando…"
          : null;

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="max-w-xl flex flex-col gap-5"
    >
      {error && (
        <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-4 py-2.5">
          {error}
        </p>
      )}

      {sizeWarning && (
        <p className="text-sm text-amber-400 bg-amber-400/10 rounded-lg px-4 py-2.5">
          {sizeWarning}
        </p>
      )}

      {sizeInfo && (
        <p className="text-sm text-emerald-400 bg-emerald-400/10 rounded-lg px-4 py-2.5">
          {formatBytes(sizeInfo.original)} → {formatBytes(sizeInfo.optimized)}
        </p>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-foreground-muted">Nombre *</span>
        <input
          name="name"
          required
          defaultValue={dish?.name}
          className="rounded-lg bg-background-panel border border-border px-4 py-2.5 text-foreground placeholder:text-foreground-dim focus:border-accent focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-foreground-muted">Descripción</span>
        <textarea
          name="description"
          rows={3}
          defaultValue={dish?.description ?? ""}
          className="rounded-lg bg-background-panel border border-border px-4 py-2.5 text-foreground placeholder:text-foreground-dim focus:border-accent focus:outline-none resize-y"
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-foreground-muted">Precio *</span>
          <input
            name="price"
            type="number"
            min="0"
            step="1"
            required
            defaultValue={dish?.price}
            className="rounded-lg bg-background-panel border border-border px-4 py-2.5 text-foreground focus:border-accent focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-foreground-muted">Orden</span>
          <input
            name="sort_order"
            type="number"
            min="0"
            defaultValue={dish?.sort_order ?? 0}
            className="rounded-lg bg-background-panel border border-border px-4 py-2.5 text-foreground focus:border-accent focus:outline-none"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-foreground-muted">Categoría</span>
        <select
          name="category_id"
          defaultValue={dish?.category_id ?? ""}
          className="rounded-lg bg-background-panel border border-border px-4 py-2.5 text-foreground focus:border-accent focus:outline-none"
        >
          <option value="">Sin categoría</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-foreground-muted">
          Foto {dish?.photo_url ? "(reemplazar)" : ""}
        </span>
        <input
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="text-sm text-foreground-muted file:mr-3 file:rounded-lg file:border-0 file:bg-background-elevated file:px-4 file:py-2 file:text-foreground file:cursor-pointer"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-foreground-muted">
          Modelo 3D (.glb) {dish?.model_url ? "(reemplazar)" : ""}
        </span>
        <input
          name="model"
          type="file"
          accept=".glb"
          className="text-sm text-foreground-muted file:mr-3 file:rounded-lg file:border-0 file:bg-background-elevated file:px-4 file:py-2 file:text-foreground file:cursor-pointer"
        />
      </label>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          name="active"
          type="checkbox"
          defaultChecked={dish?.active ?? true}
          className="w-4 h-4 rounded accent-accent"
        />
        <span className="text-sm text-foreground">Activo (visible en la carta)</span>
      </label>

      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-accent text-black font-medium px-4 py-2.5 hover:bg-accent-hover transition-colors disabled:opacity-50 self-start"
      >
        {statusLabel ?? (dish ? "Guardar cambios" : "Crear plato")}
      </button>
    </form>
  );
}
