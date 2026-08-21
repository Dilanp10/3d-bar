"use client";

import { useRef } from "react";
import { createCategory } from "./actions";

export function NewCategoryForm() {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await createCategory(formData);
        formRef.current?.reset();
      }}
      className="flex items-end gap-3"
    >
      <label className="flex flex-col gap-1.5 flex-1">
        <span className="text-sm text-foreground-muted">Nueva categoría</span>
        <input
          name="name"
          required
          placeholder="Ej: Postres"
          className="rounded-lg bg-background-panel border border-border px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-dim focus:border-accent focus:outline-none"
        />
      </label>
      <label className="flex flex-col gap-1.5 w-24">
        <span className="text-sm text-foreground-muted">Orden</span>
        <input
          name="sort_order"
          type="number"
          defaultValue={0}
          className="rounded-lg bg-background-panel border border-border px-4 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
        />
      </label>
      <button
        type="submit"
        className="rounded-lg bg-accent text-black font-medium px-4 py-2.5 text-sm hover:bg-accent-hover transition-colors"
      >
        Agregar
      </button>
    </form>
  );
}
