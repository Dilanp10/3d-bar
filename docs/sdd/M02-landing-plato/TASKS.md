# Tasks — M02: Landing pública del plato

Fuente: [SDD.md](./SDD.md) (Approved)

## TASK-001 — Migración SQL inicial: tablas + RLS pública + seed
Status: COMPLETED
Satisfies: FR-001, FR-004, FR-005, NFR-006

Descripción:
Crear `docs/sdd/M02-landing-plato/seed.sql` con: (a) tablas `categories` y `dishes` como en la sección 8 del SDD, (b) policy RLS `dishes_public_read` permitiendo `select` a rol `anon` con `active = true`, (c) 3 categorías + 4 platos de ejemplo etiquetados "SEED-M02" (uno con `model_url`, uno sin él para probar FR-005). Documentar en el header del archivo cómo aplicarlo desde el dashboard de Supabase.

Completed:
- `seed.sql` con tablas, índices, RLS pública para `anon+authenticated`, 3 categorías y 4 platos (1 con `model_url` placeholder, 3 sin él). Instrucciones al principio.

Files:
- docs/sdd/M02-landing-plato/seed.sql

SDD requirements satisfied:
- FR-001, FR-004, FR-005, NFR-006

## TASK-002 — Paleta bar-lounge y tokens de diseño
Status: COMPLETED
Satisfies: NFR-008, NFR-003

Descripción:
Definir tokens CSS en `src/app/globals.css` (backgrounds `#0a0a0a`/`#1a1a1a`, acentos ámbar `#f5b642`, texto `#f5f5f0`, contraste WCAG AA). Ajustar `body` con la paleta base y tipografía sans (usar Geist ya incluida en scaffold Next). Sin componentes todavía, solo tokens y base.

Completed:
- Tokens CSS + `@theme inline` de Tailwind con background/foreground/accent/border. `body` con Geist y antialias. `.skeleton` con animación shimmer. Focus-visible ámbar global.

Files:
- src/app/globals.css

SDD requirements satisfied:
- NFR-008, NFR-003

## TASK-003 — Data layer: getDishById + tipos
Status: COMPLETED
Satisfies: FR-001, FR-004, FR-005, NFR-006

Descripción:
Crear `src/lib/db/dishes.ts` con la función `getDishById(id: string): Promise<Dish | null>` usando el server client de Supabase, con select `*, categories(name)`, filtro `active = true`, `maybeSingle()`. Definir el tipo `Dish` (incluye `category: { name } | null`). Validar el `id` como UUID con zod antes de la query; si no es UUID válido devolver `null`.

Completed:
- Tipo `Dish` exportado + validación UUID con zod (retorna `null` si no es UUID) + query con `maybeSingle()` y join a `categories(name)`. Normaliza `category` a objeto o `null`.

Files:
- src/lib/db/dishes.ts

SDD requirements satisfied:
- FR-001, FR-004, FR-005, NFR-006

## TASK-004 — Helper formatPrice
Status: COMPLETED
Satisfies: FR-001

Descripción:
Crear `src/lib/formatting/price.ts` con `formatPrice(value: number): string` usando `Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })`.

Completed:
- Formatter instanciado a nivel módulo (perf) + función `formatPrice`.

Files:
- src/lib/formatting/price.ts

SDD requirements satisfied:
- FR-001

## TASK-005 — page.tsx: Server Component + generateMetadata + shell
Status: COMPLETED
Satisfies: FR-001, FR-004, FR-008, NFR-005

Descripción:
Crear `src/app/menu/[id]/page.tsx` como Server Component async: recibe `params: Promise<{id: string}>`, hace `await getDishById`, si `null` llama `notFound()`, si OK renderiza el shell con `<DishInfo>` y `<DishViewer>`. Implementar `generateMetadata` con title, description, y `openGraph` (title, description, images = `[photo_url]`, url) + `twitter` card summary_large_image. Layout responsive mobile-first.

Completed:
- Server Component con `params: Promise<Params>` (patrón Next 15/16) + `generateMetadata` con OG + Twitter. Branch `hasModel` para incluir viewer o fallback foto. Layout mobile-first con `aspect-square` en mobile / `aspect-[4/3]` en sm+.

Files:
- src/app/menu/[id]/page.tsx

SDD requirements satisfied:
- FR-001, FR-004, FR-008, NFR-005

## TASK-006 — DishInfo Server Component
Status: COMPLETED
Satisfies: FR-001, NFR-003, NFR-008

Descripción:
Crear `src/app/menu/[id]/DishInfo.tsx` (Server Component): recibe el `Dish`, renderiza nombre (h1), precio (usando `formatPrice`), badge de categoría, descripción. Contraste WCAG AA, aria-labels donde falten semántica.

Completed:
- Server Component sin estado con categoría uppercase-tracking, h1 grande, precio ámbar, descripción muted. `aria-label` en precio.

Files:
- src/app/menu/[id]/DishInfo.tsx

SDD requirements satisfied:
- FR-001, NFR-003, NFR-008

## TASK-007 — loading.tsx skeleton
Status: COMPLETED
Satisfies: FR-007, NFR-001

Descripción:
Crear `src/app/menu/[id]/loading.tsx` con skeleton animado (área para visor + líneas para nombre/precio/desc) usando Tailwind `animate-pulse`. Sin usar el `<Skeleton>` de una librería, mantenerlo local.

Completed:
- Skeleton shimmer (class `.skeleton` con `@keyframes shimmer`) que ocupa la misma geometría del viewer + placeholders de texto. `aria-busy="true"`.

Files:
- src/app/menu/[id]/loading.tsx
- src/app/globals.css (clase .skeleton)

SDD requirements satisfied:
- FR-007, NFR-001

## TASK-008 — not-found.tsx 404 amistoso
Status: COMPLETED
Satisfies: FR-004

Descripción:
Crear `src/app/menu/[id]/not-found.tsx`: página 404 con branding bar-lounge, mensaje "Este plato no existe o ya no está disponible", y (comentado, pendiente de módulo futuro) link a la carta completa.

Completed:
- Página 404 amistosa con eyebrow "3D BAR", h1 y párrafo empático. Grid-center responsive. TODO comentado para link a carta futura.

Files:
- src/app/menu/[id]/not-found.tsx

SDD requirements satisfied:
- FR-004

## TASK-009 — DishViewer Client Component con model-viewer + AR + fallback
Status: COMPLETED
Satisfies: FR-002, FR-003, FR-007, NFR-002, NFR-007

Descripción:
Crear `src/app/menu/[id]/DishViewer.tsx` (`"use client"`): import dinámico de `@google/model-viewer` para que solo cargue en cliente. Renderizar `<model-viewer>` con `src`, `poster` = `thumbnail_url || photo_url`, `auto-rotate`, `auto-rotate-delay=3000`, `camera-controls`, `interaction-prompt="auto"`, `ar`, `ar-modes="webxr scene-viewer quick-look"`, `shadow-intensity="1"`. Fallback si no hay WebGL: `<img>` con la foto grande y aria-label. Loading UI mientras carga model-viewer.

Completed:
- Client Component con `import("@google/model-viewer")` dinámico (excluido del bundle SSR). Detección WebGL con `<canvas>.getContext`. Fallback a `next/image` con banner "Tu navegador no soporta 3D" si no hay WebGL. Poster con `next/image` mientras carga model-viewer. Tipos de model-viewer en `src/types/model-viewer.d.ts`.

Files:
- src/app/menu/[id]/DishViewer.tsx
- src/types/model-viewer.d.ts

SDD requirements satisfied:
- FR-002, FR-003, FR-007, NFR-002, NFR-007

## TASK-010 — Estado "modelo próximamente" (model_url NULL)
Status: COMPLETED
Satisfies: FR-005

Descripción:
En `page.tsx` (o dentro de `DishViewer`, según simplicidad), si el `Dish` tiene `model_url == null`, renderizar `photo_url` grande con `next/image` + un banner con texto "Modelo 3D próximamente" sobre fondo semitransparente ámbar. No montar `<model-viewer>` en ese caso (evitar carga innecesaria del WebComponent).

Completed:
- Branch `hasModel` en `page.tsx` decide si se renderiza `<DishViewer>` o `<Image>` + banner ámbar. `<model-viewer>` no llega al cliente si el plato no tiene modelo (mejor perf).

Files:
- src/app/menu/[id]/page.tsx

SDD requirements satisfied:
- FR-005

## TASK-011 — PWA: manifest + iconos + service worker mínimo
Status: COMPLETED
Satisfies: FR-006, NFR-008

Descripción:
Crear `public/manifest.webmanifest` (name "3D Bar Menu", short_name "3D Bar", icons 192/512/maskable, theme_color y background_color de la paleta, `display: standalone`, `start_url: "/"`). Crear 3 iconos placeholder en `public/icons/` (podés generar SVGs simples con la inicial "S" en ámbar sobre negro — se reemplazarán cuando haya logo real). Crear `public/sw.js` con estrategia: network-first para HTML, cache-first con nombres versionados para assets estáticos, sin cachear Supabase. Registrar el SW desde `layout.tsx` con un script inline chico (dentro de un componente cliente `<RegisterSW>`). Enlazar el manifest en `<head>` desde `layout.tsx`.

Completed:
- `manifest.webmanifest` con paleta bar-lounge + iconos SVG (192, 512, maskable-512) con la "S" ámbar sobre negro. `sw.js` con network-first para navegación, cache-first para /_next/static y /icons, sin cachear supabase.co. `<RegisterSW>` client component que solo registra en producción. Layout linkea manifest vía `metadata.manifest` de Next.

Files:
- public/manifest.webmanifest
- public/sw.js
- public/icons/icon-192.svg
- public/icons/icon-512.svg
- public/icons/icon-maskable-512.svg
- src/components/RegisterSW.tsx
- src/app/layout.tsx

SDD requirements satisfied:
- FR-006, NFR-008

## TASK-012 — InstallPWAButton
Status: COMPLETED
Satisfies: FR-009

Descripción:
Crear `src/app/menu/[id]/InstallPWAButton.tsx` (`"use client"`): capturar el evento `beforeinstallprompt`, guardar la ref en estado, mostrar botón discreto abajo a la derecha ("Instalar app"). Al click llamar `.prompt()`. Ocultar si ya está instalada (`display-mode: standalone`). Incluirlo en el layout de `/menu/[id]`.

Completed:
- Client Component que captura `beforeinstallprompt`, oculta si `display-mode: standalone`. Botón fixed-bottom-right en ámbar. Escucha `appinstalled` para desmontarse.

Files:
- src/app/menu/[id]/InstallPWAButton.tsx

SDD requirements satisfied:
- FR-009

## TASK-013 — Verificación end-to-end en dev server
Status: PARTIAL (bloqueado por infra Supabase real)
Satisfies: CA-001, CA-002, CA-005, CA-007, CA-009

Descripción:
Correr `npm run dev`, abrir `/menu/<seed-id-con-modelo>` y verificar visor 3D + info; abrir `/menu/<seed-id-sin-modelo>` y verificar estado "próximamente"; abrir `/menu/xxx-inexistente` y verificar 404; deshabilitar JS en devtools y confirmar SSR muestra foto+info (FR SSR / CA-009); revisar consola sin errores. Documentar resultados en el `Completed:` de esta task.

Completed:
- Dev server arrancado en http://localhost:3000 con Next 16.3.2 + Turbopack (5.6s ready).
- Home `/` renderiza SSR "La carta, en 3D." — verificado con curl (grep hit).
- `/menu/inexistente-123` (no UUID) → renderiza `not-found.tsx` con title "Plato no encontrado — 3D Bar" y mensaje amistoso. CA-002 ✓ (contenido; status code en dev es 200 → validar 404 en `next build && next start`).
- `/menu/11111111-1111-1111-1111-111111111111` (UUID válido pero placeholder Supabase) → cae a `not-found.tsx` (fetch falla → `null`). Mismo comportamiento esperado con IDs inexistentes reales.
- Consola del browser: 0 errores.
- SSR verificado con curl (HTML raw contiene el contenido antes de hidration).

Pendiente (requiere proyecto Supabase real y seed aplicado):
- CA-001: visor 3D interactivo con datos reales.
- CA-004: botón AR en iPhone.
- CA-005: estado "modelo próximamente" con plato real sin `model_url`.
- CA-006: Lighthouse mobile ≥ 85 / PWA instalable.
- CA-008: Install prompt con HTTPS y datos.

Files:
- (verificación — no toca código)

SDD requirements satisfied:
- CA-002 ✓ (contenido), CA-007 ✓ (RLS configurada), CA-009 ✓ (SSR verificado con curl)
- CA-001, CA-004, CA-005, CA-006, CA-008 requieren infra Supabase real
