"use client";

import Link from "next/link";
import { toggleDishActive, deleteDish } from "./actions";

export function DishActions({ id, active }: { id: string; active: boolean }) {
  return (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={() => toggleDishActive(id, !active)}
        className="text-xs text-foreground-muted hover:text-foreground transition-colors"
        title={active ? "Desactivar" : "Activar"}
      >
        {active ? "Ocultar" : "Mostrar"}
      </button>
      <Link
        href={`/admin/dishes/${id}/edit`}
        className="text-xs text-accent hover:text-accent-hover transition-colors"
      >
        Editar
      </Link>
      <button
        onClick={async () => {
          if (confirm("¿Eliminar este plato?")) {
            await deleteDish(id);
          }
        }}
        className="text-xs text-red-400 hover:text-red-300 transition-colors"
      >
        Borrar
      </button>
    </div>
  );
}
