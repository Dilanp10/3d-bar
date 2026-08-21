# Tasks — M04: Gestión de platos y categorías (CRUD)

Fuente: [SDD.md](./SDD.md) (Approved)

Nota: implementación retroactiva. El código ya existía y está en producción; estas tasks documentan lo hecho, no guían una implementación futura.

## TASK-001 — Listado de platos con join a categoría
Status: COMPLETED
Satisfies: FR-001

Descripción:
`src/app/admin/dishes/page.tsx` (Server Component): trae todos los platos (`select id,name,price,active,sort_order,category:categories(name)`), ordenados por `sort_order`, en una tabla con columna categoría oculta en mobile.

Completed:
- Tabla responsive con badge de estado (punto verde/gris) por `active`. Fallback "No hay platos todavía." si la lista está vacía.

Files:
- src/app/admin/dishes/page.tsx

SDD requirements satisfied:
- FR-001, CA-001

## TASK-002 — Server Actions de plato: crear, editar, borrar, toggle
Status: COMPLETED
Satisfies: FR-002, FR-003, FR-004, FR-005, FR-006, FR-009

Descripción:
`src/app/admin/dishes/actions.ts`: helper `uploadFile()` (sube a bucket, devuelve public URL); `createDish`/`updateDish` arman el payload desde `FormData` e insertan/actualizan; `deleteDish`/`toggleDishActive` mutaciones simples. Todas revalidan `/admin/dishes`, `/menu/[id]` (donde aplica) y `/`.

Completed:
- 4 Server Actions completas. Upload condicional (solo si `file.size > 0`). Path de storage `dishes/<timestamp>.<ext>`.

Files:
- src/app/admin/dishes/actions.ts

SDD requirements satisfied:
- FR-002, FR-003, FR-004, FR-005, FR-006, FR-009, CA-002, CA-004, CA-005, CA-006

## TASK-003 — DishForm compartido (alta y edición)
Status: COMPLETED
Satisfies: FR-002, FR-003, NFR-005

Descripción:
`src/app/admin/dishes/DishForm.tsx` (Client): un solo formulario para alta y edición (recibe `dish?` opcional para precargar). `useActionState` para pending/error. Campos: nombre*, descripción, precio*, orden, categoría (select), foto (file), modelo .glb (file), activo (checkbox).

Completed:
- Componente único reutilizado en `new/page.tsx` y `[id]/edit/page.tsx`. Labels indican "(reemplazar)" cuando ya existe foto/modelo.

Files:
- src/app/admin/dishes/DishForm.tsx

SDD requirements satisfied:
- FR-002, FR-003, NFR-005

## TASK-004 — Páginas de alta y edición de plato
Status: COMPLETED
Satisfies: FR-002, FR-003

Descripción:
`dishes/new/page.tsx` trae categorías y renderiza `DishForm` en modo alta (`action={createDish}`). `dishes/[id]/edit/page.tsx` usa `getDishById(id, { activeOnly: false })` (extensión sobre M02) + closure server action bindeando `id` a `updateDish`.

Completed:
- Edición incluye platos inactivos (`activeOnly: false`), a diferencia de la vista pública de M02.

Files:
- src/app/admin/dishes/new/page.tsx
- src/app/admin/dishes/[id]/edit/page.tsx

SDD requirements satisfied:
- FR-002, FR-003, CA-003

## TASK-005 — DishActions (toggle/editar/borrar por fila)
Status: COMPLETED
Satisfies: FR-004, FR-005

Descripción:
`src/app/admin/dishes/DishActions.tsx` (Client): botones "Ocultar/Mostrar" (toggle sin confirmación), link "Editar", botón "Borrar" con `window.confirm()` antes de invocar `deleteDish`.

Completed:
- Toggle inmediato sin confirmación (acción reversible). Borrado con confirmación nativa del browser.

Files:
- src/app/admin/dishes/DishActions.tsx

SDD requirements satisfied:
- FR-004, FR-005, CA-005, CA-006

## TASK-006 — Listado y alta rápida de categorías
Status: COMPLETED
Satisfies: FR-007, FR-008

Descripción:
`src/app/admin/categories/page.tsx` lista categorías ordenadas por `sort_order`; `NewCategoryForm.tsx` (Client) permite alta rápida inline con reset del form tras crear.

Completed:
- Tabla + form de alta en la misma página, sin navegación.

Files:
- src/app/admin/categories/page.tsx
- src/app/admin/categories/NewCategoryForm.tsx

SDD requirements satisfied:
- FR-007, FR-008, CA-007

## TASK-007 — Edición inline de categoría (CategoryRow)
Status: COMPLETED
Satisfies: FR-007

Descripción:
`src/app/admin/categories/CategoryRow.tsx` (Client): `useState` local `editing` alterna entre fila de lectura y mini-form inline (nombre + orden) sin navegar a otra página.

Completed:
- Edición inline con botones Guardar/Cancelar. Borrado con `confirm()`.

Files:
- src/app/admin/categories/CategoryRow.tsx

SDD requirements satisfied:
- FR-007, CA-008

## TASK-008 — Server Actions de categoría: crear, editar, borrar
Status: COMPLETED
Satisfies: FR-007, FR-008, FR-009

Descripción:
`src/app/admin/categories/actions.ts`: `createCategory`/`updateCategory`/`deleteCategory`. Revalidan `/admin/categories` y `/admin/dishes` (porque el `<select>` de categoría en DishForm depende de esta lista).

Completed:
- 3 Server Actions simples sobre `categories`.

Files:
- src/app/admin/categories/actions.ts

SDD requirements satisfied:
- FR-007, FR-008, FR-009

## TASK-009 — Verificación end-to-end en producción
Status: COMPLETED
Satisfies: CA-001, CA-002, CA-003, CA-005, CA-006, CA-007, CA-008

Descripción:
Verificar en https://bar-sharif.vercel.app/admin: login → lista de 4 platos seed con datos correctos, navegación a categorías, formulario de edición precargado correctamente.

Completed:
- CA-001 verificado: tabla muestra Hamburguesa Sharif/Provoleta/Fernet con cola/Empanadas con precios y categorías correctos.
- Navegación admin ↔ categorías ↔ dishes verificada.
- Formulario de edición de "Hamburguesa Sharif" verificado con todos los campos precargados (nombre, descripción, precio, categoría select en "Principales").
- CA-002, CA-003, CA-005, CA-006, CA-007, CA-008: verificados funcionalmente en local antes del deploy; no re-verificados explícitamente en producción en esta sesión — pendiente de un smoke test manual del usuario si quiere confirmación en el dominio público.

Files:
- (verificación — no toca código)

SDD requirements satisfied:
- CA-001 ✓ (producción), CA-002/003/005/006/007/008 ✓ (verificados en local, no re-testeados en prod)

Pendiente:
- CA-004 (upload real de foto a Storage) y CA-009 (rechazo RLS a un usuario anon) no se probaron explícitamente en esta sesión — quedan como smoke test manual sugerido.
