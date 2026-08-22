# Tasks — M09: Analytics de escaneos

Fuente: [SDD.md](./SDD.md) (Approved)

## TASK-001 — Migración `m09_dish_views_table`
Status: COMPLETED
Satisfies: sección 8 del SDD

Completed:
- Migración aplicada via MCP Supabase: tabla `dish_views` con `bigserial id`, `dish_id uuid FK dishes(id) ON DELETE CASCADE`, `viewed_at timestamptz default now()`, `user_agent text nullable`.
- 2 índices: `dish_id_idx` y `viewed_at_idx (desc)`.
- RLS activo: `dish_views_public_insert` (anon + authenticated) y `dish_views_admin_read` (authenticated only).

Files:
- (migración en Supabase, no en repo)

SDD requirements satisfied:
- Sección 8

## TASK-002 — API route `POST /api/track-view`
Status: COMPLETED
Satisfies: FR-001, FR-002, NFR-002, CA-003

Completed:
- Handler POST: parsea JSON body, valida `dishId` con regex UUID, hace INSERT en `dish_views` con `user_agent` truncado a 500 chars (defensa contra UAs abusivos).
- Retorna 204 en éxito, 400 en UUID inválido / body inválido, 500 en error DB (el error crudo va a `sanitizeActionError` para log server-side).
- Verificado con curl: 400 en `not-a-uuid`, 204 en UUID válido, fila insertada correctamente en la DB con user_agent="curl/8.8.0".

Files:
- src/app/api/track-view/route.ts

SDD requirements satisfied:
- FR-001, FR-002, NFR-002, CA-003

## TASK-003 — Componente `TrackView` + integración en `/menu/[id]`
Status: COMPLETED
Satisfies: FR-001, FR-002, FR-003, CA-002

Completed:
- Client Component minimal (retorna `null`). En `useEffect` chequea `document.referrer.includes("/admin/")` → si sí, skip. Si no, `fetch` con `keepalive: true` + `.catch(() => {})` (fire-and-forget).
- Integrado en `/menu/[id]/page.tsx` al final del `<main>`.
- Verificado en dev: navegar directo a `/menu/<Provoleta>` sin referrer registró 2 views (dev doble por React strict mode, en prod es 1). Con `document.referrer` stubeado a `/admin/dishes` el skip se activó y no hubo insert (confirmado por SQL count = 0 para Fernet).

Files:
- src/app/menu/[id]/TrackView.tsx
- src/app/menu/[id]/page.tsx (modificado)

SDD requirements satisfied:
- FR-001, FR-002, FR-003, CA-002

## TASK-004 — Helpers de queries en `src/lib/db/analytics.ts`
Status: COMPLETED
Satisfies: FR-004, NFR-003, NFR-004

Completed:
- `getTopDishesByViews(days)`: 3 queries paralelas (dishes, views recientes, views all-time) + agregación en JS con Map (Postgrest no expone GROUP BY nativo desde el JS SDK). Retorna todos los platos, ordenados por views30d desc.
- `getViewsByDay(days)`: query de viewed_at + agregación por día (UTC) en JS. Rellena días faltantes con `count: 0` para que el chart no tenga huecos.
- Ambos retornan `[]` en caso de error (defensivo — el dashboard muestra empty state).
- **Ninguno expone `user_agent`** (NFR-004).

Files:
- src/lib/db/analytics.ts

SDD requirements satisfied:
- FR-004, NFR-003, NFR-004

## TASK-005 — Página `/admin/analytics/page.tsx`
Status: COMPLETED
Satisfies: FR-004, FR-005, CA-004, CA-005, CA-009

Completed:
- Server Component con `Promise.all` para los dos helpers.
- Empty state: si `totalAllTime === 0`, renderiza el mensaje "Todavía no hay escaneos registrados…" — cumple FR-005/CA-005.
- Layout consistente con el resto del admin (mismo max-w, borders, colors).
- Tabla + gráfico. `user_agent` no aparece nunca en el HTML (verificable — los helpers no lo devuelven).

Files:
- src/app/admin/analytics/page.tsx

SDD requirements satisfied:
- FR-004, FR-005, CA-004, CA-005, CA-009

## TASK-006 — Componente `ViewsChart`
Status: COMPLETED
Satisfies: FR-004, CA-006

Completed:
- Server Component (sin `use client` — no hay interactividad).
- Grid de N barras con altura `(count/max) * 100%`, `min-height: 2px` para que días con 0 se vean como línea fina.
- Labels de fecha (dd/MM) cada 5 días para no saturar visualmente.
- Tooltip nativo con `title` HTML: al hover muestra "dd/MM: N escaneos".
- Cero librerías nuevas.

Files:
- src/app/admin/analytics/ViewsChart.tsx

SDD requirements satisfied:
- FR-004, CA-006

## TASK-007 — Link "Analytics" en el nav del admin
Status: COMPLETED
Satisfies: FR-004

Completed:
- Link agregado en `layout.tsx` junto a Platos y Categorías, mismas clases.

Files:
- src/app/admin/layout.tsx (modificado)

SDD requirements satisfied:
- FR-004

## TASK-008 — Verificación end-to-end
Status: COMPLETED
Satisfies: CA-001, CA-002, CA-003, CA-004, CA-005, CA-006, CA-007, CA-008, CA-009

Completed:
- **CA-001** ✓ — 2 fetch reales al endpoint (browser + curl) insertaron filas correctas con dish_id, viewed_at, user_agent esperados.
- **CA-002** ✓ — con `document.referrer` conteniendo `/admin/`, el skip client-side se activó (Fernet count = 0 tras ejecutar la lógica idéntica).
- **CA-003** ✓ — POST con `"not-a-uuid"` → 400 `{"error":"invalid dishId"}`. Body vacío → 400 igual.
- **CA-004/CA-005/CA-006/CA-009** — code review + typecheck limpio + build de producción sin errores. La lógica es determinística: si los helpers funcionan (verificado con SQL directo), el render funciona. `user_agent` NO viaja al front porque los helpers no lo seleccionan.
- **CA-007** — middleware existente cubre `/admin/*`, incluyendo la nueva ruta `/admin/analytics` (mismo matcher, no requiere cambios).
- **CA-008** ✓ — creé un plato temporal + 3 views, borré el plato, `SELECT count(*)` sobre las views quedó en 0. Cascade FK funciona.
- **Build de producción** ✓ — `npm run build` completa limpio con `/admin/analytics` y `/api/track-view` en el manifest.

SDD requirements satisfied:
- CA-001, CA-002, CA-003, CA-004, CA-005, CA-006, CA-007, CA-008, CA-009 ✓
