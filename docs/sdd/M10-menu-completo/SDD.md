# SDD — M10: Vista pública del menú completo

## 1. Identificación
Module: M10
Name: Vista pública del menú completo
Status: Approved

## 2. Objetivo
Hoy la única forma de ver un plato es escanear su QR individual (`/menu/[id]`) — no existe una "carta completa" navegable. M10 agrega `/menu`: una página pública que lista todos los platos activos, agrupados por categoría, cada uno linkeando a su landing individual. Sirve como fallback/complemento al flujo por QR (por ejemplo, para compartir un link único de la carta, o para un cliente que quiere ver todo antes de elegir qué plato mirar en 3D).

## 3. Alcance

Incluye:
- Página nueva `src/app/menu/page.tsx` (coexiste con la ruta dinámica `src/app/menu/[id]/page.tsx` ya existente — Next.js App Router permite ambas).
- Helper `getPublicMenu()` en `src/lib/db/menu.ts`: trae categorías (ordenadas por `sort_order`) con sus platos activos (ordenados por `sort_order`), más un grupo "Otros" al final para platos sin `category_id`.
- Cada plato en la lista muestra: thumbnail (imagen plana, sin `<model-viewer>`), nombre, precio, y linkea a `/menu/[id]`.
- Empty state si no hay ningún plato activo.
- Metadata (`title`, `og:*`) consistente con el resto del sitio público.
- Link "Ver la carta completa" agregado a la home (`/`), que hoy no tiene ninguna forma de llegar a `/menu`.
- `revalidatePath("/menu")` agregado a las Server Actions que mutan `dishes`/`categories` (createDish, updateDish, deleteDish, toggleDishActive, createCategory, updateCategory, deleteCategory) para que el listado se mantenga fresco.

No incluye:
- ~~Buscador o filtros por categoría/precio dentro de `/menu`~~ **agregado post-MVP** (ver `src/app/menu/MenuFilters.tsx`): búsqueda por nombre + filtro por categoría + filtro "Con 3D", client-side sobre los datos ya traídos por `getPublicMenu()`. No cambió el modelo de datos (tal como se había previsto acá), sólo extendió `MenuDish` con `has_model`/`price_display`. Ver FR-008 y CA-008.
- Visor 3D en la vista de lista (sólo en `/menu/[id]`, como ya funciona).
- Tracking de analytics para esta página (M09 trackea vistas de plato individual, no de la lista — se puede evaluar como extensión futura, no ahora).
- Cambiar el flujo de QR existente — `/menu/[id]` sigue siendo la ruta que codifican los QRs (M06), esto es un camino adicional, no un reemplazo.

## 4. Requisitos funcionales

- FR-001 — `/menu` debe listar todos los platos con `active = true`, agrupados por categoría, en el orden `categories.sort_order` asc.
- FR-002 — Dentro de cada categoría, los platos se ordenan por `dishes.sort_order` asc.
- FR-003 — Los platos con `category_id = null` se agrupan bajo un grupo "Otros", que aparece **al final** del listado (después de todas las categorías nombradas).
- FR-004 — Cada plato en la lista muestra: thumbnail (`thumbnail_url ?? photo_url`, o un placeholder si no hay ninguna), nombre, precio formateado. Al hacer click/tap navega a `/menu/[id]`.
- FR-005 — Si no hay ningún plato activo en todo el sistema, `/menu` muestra el mensaje "La carta está siendo armada. Volvé más tarde." en vez de una lista vacía.
- FR-006 — La home (`/`) debe tener un link visible "Ver la carta completa" que navegue a `/menu`.
- FR-007 — Al activar/desactivar un plato, o crear/editar/borrar un plato o categoría desde el admin, `/menu` debe reflejar el cambio (via `revalidatePath`).
- FR-008 — `/menu` debe permitir buscar por nombre, filtrar por categoría y filtrar "sólo con modelo 3D", combinables entre sí, sin recargar la página (`src/app/menu/MenuFilters.tsx`, client-side sobre la lista ya cargada).

## 5. Requisitos no funcionales

- NFR-001 — La página no debe cargar `<model-viewer>` ni ningún bundle de 3D — sólo imágenes planas (`next/image`), para que sea liviana en 4G.
- NFR-002 — Responsive: grid de 2 columnas en mobile, más columnas en desktop, consistente con el resto del sitio (dark theme, accent color).
- NFR-003 — Metadata (`title`, `og:title`, `og:description`) siguiendo el mismo patrón que `/menu/[id]` (M02), usando `NEXT_PUBLIC_APP_URL`.

## 6. Arquitectura del módulo

**Archivos nuevos:**
- `src/lib/db/menu.ts` — `getPublicMenu(): Promise<MenuSection[]>` donde `MenuSection = { id: string | null, name: string, dishes: MenuDish[] }` y `MenuDish = { id, name, price, thumbnail_url }`. Query: trae `categories` ordenadas + `dishes` activos ordenados, agrupa en JS (evita N+1: una query a categories, una a dishes con join). Los platos sin categoría van a un `MenuSection` sintético `{ id: null, name: "Otros", dishes: [...] }` agregado al final sólo si tiene al menos 1 plato.
- `src/app/menu/page.tsx` — Server Component: `generateMetadata()` + render de las secciones. Si `getPublicMenu()` devuelve todo vacío, muestra el empty state.
- `src/app/menu/MenuGrid.tsx` (opcional, si conviene separar del page.tsx por legibilidad) — recibe las secciones y renderiza el grid con `<Link>` a cada plato.

**Archivos modificados:**
- `src/app/page.tsx` — agregar `<Link href="/menu">Ver la carta completa</Link>` junto al link existente de administración.
- `src/app/admin/dishes/actions.ts` — agregar `revalidatePath("/menu")` en `createDish`, `updateDish`, `deleteDish`, `toggleDishActive`.
- `src/app/admin/categories/actions.ts` — agregar `revalidatePath("/menu")` en `createCategory`, `updateCategory`, `deleteCategory`.

## 7. Flujo de datos

```
Cliente entra a /menu (desde la home o un link compartido)
  → Server Component page.tsx
    → getPublicMenu()
      → SELECT categories ORDER BY sort_order
      → SELECT dishes WHERE active=true ORDER BY sort_order
      → agrupar dishes por category_id en JS, mapeando a nombres de categoría
      → armar array de secciones + "Otros" al final si aplica
  → renderiza secciones con grid de MenuDish → cada card es <Link href={`/menu/${dish.id}`}>
```

## 8. Modelo de datos
Sin cambios — reusa `categories` y `dishes` existentes.

## 9. API
Sin endpoints nuevos — todo vía Server Component + Supabase directo (mismo patrón que `/menu/[id]` y `/admin/dishes`).

## 10. Seguridad
Sin cambios — usa las policies de lectura pública (`*_public_read`) ya existentes en `categories` y `dishes`. No requiere sesión.

## 11. Dependencias

Módulos:
- M02 (landing pública) — COMPLETED — `/menu/[id]` es el destino de cada card.
- M04 (CRUD platos) — COMPLETED — provee los datos y las Server Actions donde se agrega `revalidatePath`.

Librerías: ninguna nueva.

## 12. Criterios de aceptación

- CA-001 — `/menu` en dev/producción muestra sólo platos con `active = true`, agrupados por categoría en el orden correcto (`sort_order`).
- CA-002 — Un plato sin `category_id` aparece en un grupo "Otros" al final del listado.
- CA-003 — Click en un plato de la lista navega a `/menu/<id>` correcto.
- CA-004 — Con cero platos activos (verificable desactivando todos temporalmente), `/menu` muestra el mensaje de empty state.
- CA-005 — Desactivar un plato desde `/admin/dishes` y recargar `/menu` — el plato ya no aparece.
- CA-006 — La home (`/`) tiene un link visible que navega correctamente a `/menu`.
- CA-007 — El HTML de `/menu` incluye `<title>` y metadata `og:*` coherente con el resto del sitio.
- CA-008 — Escribir en el buscador, tocar una categoría, o activar "Con 3D" filtra la lista en el cliente sin recargar; combinar los tres filtros da la intersección correcta.
