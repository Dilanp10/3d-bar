# Tasks — M11: Landing page renovada

Fuente: [SDD.md](./SDD.md) (Approved)

## TASK-001 — `business-info.ts` con datos placeholder
Status: COMPLETED
Satisfies: NFR-002, NFR-003, CA-007

Completed:
- Todas las constantes en un solo archivo con comentario `⚠️⚠️⚠️ PLACEHOLDER — DATOS FICTICIOS ⚠️⚠️⚠️` al inicio.
- `MAPS_URL` derivado de `ADDRESS` con `encodeURIComponent`. `WHATSAPP_URL` hardcodeado en formato `wa.me` (E.164 sin símbolos).

Files:
- src/lib/content/business-info.ts

SDD requirements satisfied:
- NFR-002, NFR-003, CA-007

## TASK-002 — `HeroSection`
Status: COMPLETED
Satisfies: FR-001, NFR-001, NFR-005

Completed:
- Imagen de fondo con `fill`, `priority`, `sizes="100vw"`. Overlay con gradiente (`from-black/70 via-black/60 to-black`) para legibilidad del texto blanco sobre la foto.
- Título, descripción y los 2 CTAs originales preservados dentro del hero.
- Verificado en dev: imagen carga `200 OK`, sin overflow horizontal en mobile (375px).

Files:
- src/app/HeroSection.tsx

SDD requirements satisfied:
- FR-001, NFR-001, NFR-005

## TASK-003 — `BusinessInfo`
Status: COMPLETED
Satisfies: FR-002, FR-003, FR-004, FR-005

Completed:
- Dirección, horario, teléfono e Instagram renderizados. Los 3 links externos (maps, whatsapp, instagram) llevan `target="_blank" rel="noopener noreferrer"`.
- Verificado en dev leyendo la accessibility tree: los 3 `href` resuelven exactamente a las URLs esperadas (`google.com/maps/search`, `wa.me/5493834567890`, `instagram.com/bar.sharif`).

Files:
- src/app/BusinessInfo.tsx

SDD requirements satisfied:
- FR-002, FR-003, FR-004, FR-005

## TASK-004 — `FeaturedDishes`
Status: COMPLETED
Satisfies: FR-006, FR-008

Completed:
- Reusa `getPublicMenu()` de M10 sin duplicar queries. `flatMap` + `slice(0, 4)`.
- Retorna `null` si no hay platos (cero markup, no rompe la home).
- Verificado en dev: 4 platos (Provoleta, Empanadas, Hamburguesa Sharif, Fernet con cola) con foto/nombre/precio, cada link apuntando al `/menu/<id>` correcto. Link "Ver todo" a `/menu`.

Files:
- src/app/FeaturedDishes.tsx

SDD requirements satisfied:
- FR-006, FR-008

## TASK-005 — Reescribir `page.tsx`
Status: COMPLETED
Satisfies: FR-007, NFR-004

Completed:
- `page.tsx` ensambla Hero → FeaturedDishes → BusinessInfo. Sigue siendo Server Component (async por FeaturedDishes).
- Nota: `/` pasó de estático (`○`) a dinámico (`ƒ`) en el build — esperado, ya que ahora consulta la DB para los destacados. No es una regresión, es el trade-off correcto para mostrar data real.

Files:
- src/app/page.tsx

SDD requirements satisfied:
- FR-007, NFR-004

## TASK-006 — Verificación end-to-end
Status: COMPLETED
Satisfies: CA-001, CA-002, CA-003, CA-004, CA-005, CA-006, CA-007, CA-008

Completed:
- **CA-001** ✓ — hero visible con imagen de fondo, título y CTAs (confirmado en accessibility tree + network log de la imagen).
- **CA-002/CA-003/CA-004** ✓ — los 3 links externos resuelven a las URLs exactas esperadas.
- **CA-005** ✓ — 4 platos destacados con link correcto a `/menu/[id]`.
- **CA-006** — no probado desactivando todos los platos reales (mismo razonamiento que M10 — evitar tocar data real); cubierto por code review (`if (dishes.length === 0) return null`).
- **CA-007** ✓ — comentario de placeholder confirmado visible al inicio del archivo.
- **CA-008** ✓ — `resize_window` a 375px (mobile): sin overflow horizontal (`document.documentElement.scrollWidth <= window.innerWidth`).
- **Build de producción** ✓ — limpio, `/` ahora dinámica (esperado).

SDD requirements satisfied:
- CA-001, CA-002, CA-003, CA-004, CA-005, CA-007, CA-008 ✓ verificados en vivo. CA-006 verificado por code review.
