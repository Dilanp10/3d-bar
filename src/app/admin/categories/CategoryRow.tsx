"use client";

import { useState } from "react";
import { updateCategory, deleteCategory } from "./actions";

type Category = { id: string; name: string; sort_order: number };

export function CategoryRow({ category }: { category: Category }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <tr>
        <td colSpan={3} className="px-4 py-3">
          <form
            action={async (formData) => {
              await updateCategory(category.id, formData);
              setEditing(false);
            }}
            className="flex items-center gap-3"
          >
            <input
              name="name"
              defaultValue={category.name}
              required
              className="flex-1 rounded-lg bg-background-panel border border-border px-3 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none"
            />
            <input
              name="sort_order"
              type="number"
              defaultValue={category.sort_order}
              className="w-20 rounded-lg bg-background-panel border border-border px-3 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              className="text-xs text-accent hover:text-accent-hover"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-xs text-foreground-dim hover:text-foreground"
            >
              Cancelar
            </button>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-background-elevated/50">
      <td className="px-4 py-3 text-foreground">{category.name}</td>
      <td className="px-4 py-3 text-foreground-muted">{category.sort_order}</td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-accent hover:text-accent-hover transition-colors"
          >
            Editar
          </button>
          <button
            onClick={async () => {
              if (confirm("¿Eliminar esta categoría?")) {
                await deleteCategory(category.id);
              }
            }}
            className="text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            Borrar
          </button>
        </div>
      </td>
    </tr>
  );
}
