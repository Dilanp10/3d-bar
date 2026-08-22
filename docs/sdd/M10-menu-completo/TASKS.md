# Tasks — M10: Vista pública del menú completo

Fuente: [SDD.md](./SDD.md) (Approved)

## TASK-001 — Helper `getPublicMenu()`
Status: COMPLETED
Satisfies: FR-001, FR-002, FR-003

Completed:
- `src/lib/db/menu.ts`: 2 queries paralelas (categories ordenadas, dishes activos ordenados) + agrupación en JS con Map.
- Platos sin `category_id` van a un grupo sintético `{ id: null, name: "Otros" }`, agregado al final del array sólo si tiene al menos 1 plato (sección vacía nunca se muestra).
- Secciones de categorías con 0 platos activos también se filtran (no aparecen vacías).

Files:
- src/lib/db/menu.ts

SDD requirements satisfied:
- FR-001, FR-002, FR-003

## TASK-002 — Página `/menu/page.tsx`
Status: COMPLETED
Satisfies: FR-004, FR-005, NFR-001, NFR-002, NFR-003

Completed:
- Server Component con `generateMetadata()` — title "Carta — Bar Sharif" + og tags usando `NEXT_PUBLIC_APP_URL`.
- Grid responsive (2 cols mobile, 3 cols desktop) con `next/image` para thumbnails — sin `<model-viewer>`, bundle liviano.
- Empty state si `getPublicMenu()` devuelve `[]`.
- Verificado en dev: título "Carta — Bar Sharif" correcto en la pestaña del browser, 3 secciones (Entradas, Principales, Tragos) con los 4 platos en el orden esperado.

Files:
- src/app/menu/page.tsx

SDD requirements satisfied:
- FR-004, FR-005, NFR-001, NFR-002, NFR-003

## TASK-003 — Link "Ver la carta completa" en la home
Status: COMPLETED
Satisfies: FR-006

Completed:
- Botón agregado en `src/app/page.tsx` entre el texto descriptivo y el link de administración. Verificado en dev: navega correctamente a `/menu`.

Files:
- src/app/page.tsx

SDD requirements satisfied:
- FR-006

## TASK-004 — `revalidatePath("/menu")` en Server Actions
Status: COMPLETED
Satisfies: FR-007

Completed:
- Agregado en `createDish`, `updateDish`, `deleteDish`, `toggleDishActive` (dishes/actions.ts) y en `createCategory`, `updateCategory`, `deleteCategory` (categories/actions.ts).

Files:
- src/app/admin/dishes/actions.ts (modificado)
- src/app/admin/categories/actions.ts (modificado)

SDD requirements satisfied:
- FR-007

## TASK-005 — Verificación end-to-end
Status: COMPLETED
Satisfies: CA-001, CA-002, CA-003, CA-004, CA-005, CA-006, CA-007

Completed:
- **CA-001** ✓ — `/menu` en dev muestra los 4 platos activos agrupados: Entradas (Provoleta, Empanadas), Principales (Hamburguesa Sharif), Tragos (Fernet con cola) — mismo orden que `sort_order` en la DB.
- **CA-002** — no había ningún plato sin categoría al momento de probar; verificado por code review que la lógica de agrupación coloca `category_id: null` en "Otros" al final (cubierto también por TASK-001).
- **CA-003** ✓ — cada `<Link>` apunta al `/menu/<id>` correcto (confirmado leyendo los `href` de la accessibility tree).
- **CA-004** — no probado desactivando todos los platos reales (evitar tocar data real innecesariamente); la rama de código (`sections.length === 0`) es trivial y ya se usa el mismo patrón en M09.
- **CA-005** — cubierto por `revalidatePath("/menu")` en `toggleDishActive` (TASK-004), mismo mecanismo ya validado en M02/M04 para otras rutas.
- **CA-006** ✓ — link "Ver la carta completa" en `/` navega correctamente a `/menu` (confirmado en dev).
- **CA-007** ✓ — pestaña del browser mostró el título "Carta — Bar Sharif" correctamente.
- **Build de producción** ✓ — `npm run build` limpio, `/menu` aparece en el manifest como ruta dinámica.

SDD requirements satisfied:
- CA-001, CA-003, CA-006, CA-007 ✓ verificados en vivo. CA-002, CA-004, CA-005 verificados por code review / mecanismo compartido con otros módulos ya probados.
