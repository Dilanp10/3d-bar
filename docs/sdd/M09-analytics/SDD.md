# SDD — M09: Analytics de escaneos

## 1. Identificación
Module: M09
Name: Analytics de escaneos
Status: Approved

## 2. Objetivo
Registrar cada visita a `/menu/[id]` (cada vez que un cliente escanea un QR y llega a la landing del plato) y darle al dueño un dashboard en `/admin/analytics` para responder dos preguntas: **qué plato se escanea más** y **cómo evolucionan los escaneos día a día**. Es un feedback loop simple para que el dueño aprenda qué platos funcionan mejor en la carta.

## 3. Alcance

Incluye:
- Tabla nueva `dish_views` en Postgres: `id bigserial pk`, `dish_id uuid fk → dishes(id) on delete cascade`, `viewed_at timestamptz default now()`, `user_agent text nullable`.
- RLS: `INSERT` pública (para que el cliente anon pueda registrar sin auth), `SELECT` sólo `authenticated` (para que sólo el admin lea el dashboard).
- Registro **client-side** desde `/menu/[id]`: un Client Component nuevo `TrackView` hace `fire-and-forget` un `POST` a una API route `/api/track-view` al montarse, pasando `dishId` en el body. La route usa el anon client de Supabase y hace `insert` en `dish_views`.
- Dashboard nuevo `/admin/analytics/page.tsx` (Server Component) con:
  - **Top platos escaneados** (últimos 30 días): tabla con nombre + count, ordenado desc.
  - **Escaneos por día** (últimos 30 días): sparkline/bar chart simple hecho con divs + inline CSS (sin librería de charts).
  - **Total all-time por plato**: columna extra en la misma tabla.
- Link "Analytics" en el nav del admin junto a "Platos" y "Categorías".

No incluye:
- Deduplicación por IP/UA (una recarga cuenta como un escaneo nuevo — decisión, ver sección 10).
- Retención automática / purge de eventos viejos (baja frecuencia esperada, se puede purgar manualmente si molesta).
- Filtros por rango de fechas o categoría en el dashboard (fuera de MVP de analytics; agregable después sin cambiar el schema).
- Exportar CSV / integración con Google Analytics / Umami / Plausible (fuera de alcance).
- Registro en el flujo del admin (los escaneos que hace el propio dueño desde `/admin/qrs/print` no deben aparecer como visitas — ver sección 10 para cómo mitigamos).
- Tracking de eventos internos al plato (rotación 3D, botón instalar PWA, etc.) — fuera de alcance.

## 4. Requisitos funcionales

- FR-001 — Cada visita a `/menu/[id]` que ejecute JavaScript en el browser debe registrar una fila nueva en `dish_views` con el `dish_id` correspondiente. Si `dish_id` no existe (ruta 404), no se registra nada.
- FR-002 — El registro debe ser **fire-and-forget** desde el cliente: si el POST falla o tarda, la landing sigue funcionando normalmente. No hay indicador de éxito visible para el cliente.
- FR-003 — Sólo se registra en visitas de clientes finales, no en previews/renders del admin. Mitigación: si `document.referrer` matchea `/admin/`, se skippea el track (evita contar las veces que el dueño abre el QR desde el dashboard para probarlo).
- FR-004 — La página `/admin/analytics` (protegida por middleware) debe mostrar:
  - Una tabla con todos los platos, ordenada por cantidad de escaneos últimos 30 días (desc), con columnas: nombre del plato, escaneos últimos 30d, escaneos all-time.
  - Un gráfico de barras verticales con la cantidad total de escaneos por día en los últimos 30 días.
- FR-005 — Si aún no hay ningún escaneo registrado, el dashboard muestra un mensaje claro ("Todavía no hay escaneos registrados. Los datos aparecerán acá cuando alguien escanee un QR").

## 5. Requisitos no funcionales

- NFR-001 — El registro no debe agregar más de ~50ms al TTI de `/menu/[id]` (el POST corre después de la hidratación, en un `useEffect`).
- NFR-002 — El endpoint `/api/track-view` debe responder rápido (< 200ms) — un INSERT simple sin joins.
- NFR-003 — El dashboard debe cargar en < 2s con hasta 10.000 filas en `dish_views` (usar índice por `dish_id` y `viewed_at`).
- NFR-004 — Los queries del dashboard no deben exponer el `user_agent` completo a la UI (privacidad — el user_agent se guarda para eventual debugging server-side, pero no se muestra ni exporta al front).
- NFR-005 — Ningún dato personal (IP cruda, cookie de usuario, geolocalización) se persiste en la DB. El `user_agent` es el único dato de contexto guardado.

## 6. Arquitectura del módulo

**Archivos nuevos:**
- Migración Supabase `m09_dish_views_table.sql`:
  ```sql
  create table dish_views (
    id bigserial primary key,
    dish_id uuid not null references dishes(id) on delete cascade,
    viewed_at timestamptz not null default now(),
    user_agent text
  );
  create index dish_views_dish_id_idx on dish_views(dish_id);
  create index dish_views_viewed_at_idx on dish_views(viewed_at desc);
  alter table dish_views enable row level security;
  create policy dish_views_public_insert on dish_views for insert to anon, authenticated with check (true);
  create policy dish_views_admin_read on dish_views for select to authenticated using (true);
  ```
- `src/app/api/track-view/route.ts` — API route POST que recibe `{ dishId }`, valida que sea UUID, hace `INSERT` en `dish_views` con `user_agent` del header. Usa el server client (que autentica anon con la anon key).
- `src/app/menu/[id]/TrackView.tsx` — Client Component minimal que en `useEffect` chequea `document.referrer` (si contiene `/admin/`, skip), luego `fetch("/api/track-view", { method: "POST", body: JSON.stringify({ dishId }) })` sin await ni error handling visible. Se importa desde `/menu/[id]/page.tsx`.
- `src/lib/db/analytics.ts` — helpers server-side: `getTopDishesByViews(days)` y `getViewsByDay(days)` — encapsulan los queries agregados.
- `src/app/admin/analytics/page.tsx` — Server Component que llama los helpers y renderiza tabla + gráfico.
- `src/app/admin/analytics/ViewsChart.tsx` — Server Component (o marcado como Client si necesita interactividad, pero puede ser 100% server con divs + inline styles) para el gráfico de barras.

**Archivos modificados:**
- `src/app/menu/[id]/page.tsx` — insertar `<TrackView dishId={dish.id} />` al final del render (invisible, sólo dispara el fetch).
- `src/app/admin/layout.tsx` — agregar `<Link href="/admin/analytics">Analytics</Link>` en el nav.

## 7. Flujo de datos

**Registro:**
```
Cliente escanea QR
  → /menu/[id] SSR + hidration
  → TrackView useEffect
    → si document.referrer contiene "/admin/": skip
    → fetch POST /api/track-view { dishId }
  → route.ts
    → validar UUID
    → INSERT into dish_views (dish_id, user_agent)
    → 204 No Content (fire-and-forget, cliente no lee la respuesta)
```

**Dashboard:**
```
Admin navega /admin/analytics
  → middleware valida sesión
  → Server Component llama:
    - getTopDishesByViews(30): SELECT d.name, count(*) FROM dish_views v JOIN dishes d ON d.id=v.dish_id WHERE viewed_at >= now() - interval '30 days' GROUP BY d.id ORDER BY count desc
    - getViewsByDay(30): SELECT date_trunc('day', viewed_at) AS day, count(*) FROM dish_views WHERE viewed_at >= now() - interval '30 days' GROUP BY day ORDER BY day
  → renderiza tabla + gráfico
```

## 8. Modelo de datos

```
dish_views
  id           bigserial   PK
  dish_id      uuid        FK dishes(id) ON DELETE CASCADE  (index)
  viewed_at    timestamptz DEFAULT now()                     (index desc)
  user_agent   text        nullable
```

Al borrar un plato, sus views se borran automáticamente (cascade). Sin joins con otras tablas.

## 9. API

### `POST /api/track-view`
- **Body:** `{ "dishId": "<uuid>" }`
- **Response 204:** No content, sin body.
- **Response 400:** `{ "error": "invalid dishId" }` si el UUID es inválido o falta.
- **Response 500:** `{ "error": "failed" }` si falla el insert; el error crudo va a Vercel Logs vía `sanitizeActionError` (o análogo para routes).
- **Auth:** no requiere sesión — usa la anon key y la policy `dish_views_public_insert` permite `INSERT` con `WITH CHECK (true)` a `anon`.

## 10. Seguridad y decisiones de arquitectura

**Decisión: sin deduplicación por IP/UA.**
Un bar chico probablemente reciba <100 escaneos/día. Deduplicar agrega complejidad (necesita hashear IP, decidir ventana de dedup, etc.) y para el uso real ("qué plato se pide más") no aporta — si un cliente escanea el mismo plato 3 veces mientras decide, esas 3 veces cuentan como interés real. Al ser un dato de tendencia (relativo entre platos), el "ruido" se cancela.

**Decisión: sin retención automática.**
Con <100 escaneos/día × 365 días = ~36.500 filas/año. Postgres maneja eso sin problemas. Si en el futuro molesta, se puede purgar con un DELETE simple. Meter cron/pg_cron ahora es over-engineering.

**Decisión: registro client-side vs server-side.**
- Client-side (elegido): sólo cuenta cuando el JS ejecuta = no cuenta crawlers, no cuenta preloads sin hidration. Métrica más limpia para "cliente humano que llegó al plato".
- Server-side descartado: contaría cualquier bot/crawler/preview que hidrate el HTML, sin distinguir. Además desde el SSR es más complicado saber si el request viene de un admin o de un cliente real.

**Decisión: excluir visitas desde el admin.**
El dueño va a abrir sus propios QRs para probar. `document.referrer` contendrá `/admin/` cuando el admin navegue desde el listado o desde la página de QRs. Es una heurística imperfecta (el dueño puede escanear su propio QR con el móvil desde afuera del admin y sí va a contar) pero cubre el 90% del caso.

**Privacidad:**
- No se guarda IP cruda, cookies del cliente, ni geolocalización.
- El `user_agent` se guarda opcionalmente y NO se expone al front del admin (NFR-004) — está sólo para debugging server-side (ej. saber si vino de iOS/Android).
- La policy RLS `dish_views_public_insert` permite escrituras anónimas — es intencional. El worst case si alguien abusa: llena la tabla con inserts falsos. Mitigación: rate limit natural de Supabase Auth/anon calls; si en el futuro es problema, se agrega captcha o rate limit propio (fuera de MVP).

**Decisión: chart sin librería.**
`recharts`/`victory`/`nivo` son ~200KB. Un chart de barras de 30 días se hace con un `div` por día + `height: <count>/max * 100%`. Cero deps nuevas, se ve consistente con el resto del admin.

## 11. Dependencias

Módulos:
- M02 (landing pública) — COMPLETED — es donde se dispara el track.
- M03 (auth admin) — COMPLETED — protege el dashboard.
- M04 (CRUD platos) — COMPLETED — provee la lista de platos para joinear.

Librerías: ninguna nueva.

Config: ninguna nueva.

Migración Supabase: `m09_dish_views_table` (aplicar como parte de la implementación).

## 12. Criterios de aceptación

- CA-001 — Escanear un QR de producción con un móvil real (o abrir `/menu/[id]` en un browser limpio, sin referrer del admin) registra una nueva fila en `dish_views` con el `dish_id` correcto y `viewed_at ≈ now()`.
- CA-002 — Abrir `/menu/[id]` desde el listado del admin (referrer `/admin/dishes`) o desde `/admin/qrs/print` **no** registra nada (skip por referrer).
- CA-003 — `POST /api/track-view` con `dishId` inválido (no UUID, o UUID que no existe en `dishes`) devuelve 400 sin insert.
- CA-004 — Con al menos 1 escaneo registrado, `/admin/analytics` muestra al plato en la tabla con `count = 1` últimos 30d y all-time.
- CA-005 — Con 0 escaneos, `/admin/analytics` muestra el mensaje "Todavía no hay escaneos registrados…" en vez de una tabla vacía.
- CA-006 — El gráfico de barras muestra correctamente los conteos por día (verificable comparando visualmente con el resultado de `SELECT date_trunc('day', viewed_at), count(*) FROM dish_views GROUP BY 1`).
- CA-007 — Usuario no autenticado que intente entrar a `/admin/analytics` es redirigido a `/admin/login` (comportamiento del middleware existente).
- CA-008 — Borrar un plato desde el admin también borra sus views (verificable con SQL: `SELECT count(*) FROM dish_views WHERE dish_id = <borrado>` = 0 después del delete, por el cascade).
- CA-009 — Ningún response del dashboard incluye el `user_agent` de las filas (verificable inspeccionando el HTML servido).
