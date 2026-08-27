# Tasks — M13: Panel de admin más simple

Fuente: SDD.md (Approved)

## TASK-001 — Tarjetas de plato en la lista
Status: COMPLETED
Satisfies: FR-001, FR-003

Descripción:
`/admin/dishes/page.tsx` trae foto/thumbnail/categoría y renderiza tarjetas
(`DishCard`) en grid responsive + estado vacío guiado con botón "+ Nuevo plato".

## TASK-002 — Acciones como botones grandes con ícono + texto
Status: COMPLETED
Satisfies: FR-002, FR-005

Descripción:
`DishActions` con botones táctiles (ícono+label): Editar, Ver QR,
Mostrar/Ocultar, Borrar. Confirmación de borrado con el nombre del plato.

## TASK-003 — Ayudas y agrupación en el formulario
Status: COMPLETED
Satisfies: FR-004

Descripción:
`DishForm` con textos de ayuda por campo y agrupación visual (Datos / Foto /
Modelo 3D). Mantiene la lógica de optimización y el feedback de progreso.

## TASK-004 — Nav del admin con íconos
Status: COMPLETED
Satisfies: FR-006

Descripción:
`admin/layout.tsx`: nav con íconos + etiquetas (Platos, Categorías, Analytics,
Salir).

## TASK-005 — Retoque leve de Categorías + verificación
Status: COMPLETED
Satisfies: NFR-001, NFR-004, CA-006

Descripción:
Consistencia visual en `/admin/categories` (botón primario/estado vacío).
`tsc`/`eslint`/`next build` limpios; deploy y smoke test.
