# Estado del proyecto — Bar Sharif Menu 3D

App para el Bar Sharif donde cada plato de la carta tiene un QR que, al escanearse, abre una URL con el plato en 3D interactivo. Un admin único (dueño del bar) carga los platos con sus modelos `.glb` generados afuera con RealityScan.

## Arquitectura

**Cliente (público):** escanea QR → URL `https://bar-sharif.vercel.app/menu/[id]` → landing con `<model-viewer>` cargando `.glb` optimizado + info del plato. PWA opcional (instalable).

**Admin (login único):** panel en `/admin/*` → carga foto + datos + `.glb` de RealityScan → el browser del admin optimiza el `.glb` (Draco + WebP) → sube directo a Supabase Storage (bypass de Vercel Functions, límite 4.5MB) → genera QR imprimible.

### Stack
- **Frontend:** Next.js 16 (App Router) + Tailwind 4
- **3D:** `<model-viewer>` de Google (WebComponent, AR nativo iOS/Android)
- **Backend/DB/Auth/Storage:** Supabase (Postgres + Auth email/pass + Storage)
- **Optimización .glb:** `@gltf-transform/core` + `@gltf-transform/functions`, corriendo **client-side** (browser del admin, WASM) — Draco para geometría + resize/WebP para texturas. KTX2 real descartado (requiere binario nativo `toktx`, no disponible en Vercel ni browser). En progreso M05.
- **QRs:** `qrcode` (npm) — pendiente M06
- **Deploy:** Vercel (https://bar-sharif.vercel.app)

### Modelo de datos
```
categories (id, name, sort_order)
dishes (id, name, description, price, category_id,
        photo_url, model_url, thumbnail_url,
        sort_order, active, created_at)
```
RLS: lectura pública (`*_public_read`) + escritura solo admin authenticated (`*_admin_write`).

### Flujos clave
- **Admin carga plato:** foto (Server Action, sin cambios) + .glb (optimizado client-side, subido directo a Storage desde el browser — M05) + datos → DB → QR listo (M06).
- **Cliente escanea:** QR → `/menu/[id]` → visor 3D + info + botón PWA opcional.

## Módulos

- M01 — Setup del proyecto: COMPLETED
- M02 — Landing pública del plato (`/menu/[id]`): COMPLETED (deployed en producción, verificado en https://bar-sharif.vercel.app/menu/[id])
- M03 — Autenticación del admin: COMPLETED (reconciliado retroactivamente — código reescrito para cumplir SDD; falta confirmar sign-ups OFF en dashboard Supabase — TASK-008 abierta)
- M04 — Gestión de platos (CRUD sin 3D): COMPLETED (SDD retroactivo aprobado; gaps de seguridad documentados como deuda conocida, no bloqueante — ver sección 10 del SDD)
- M05 — Upload y optimización de `.glb`: COMPLETED (pipeline Draco+WebP client-side funcionando, verificada end-to-end con un `.glb` sintético de ~40k triángulos: optimiza, sube a Storage, crea el plato, se ve bien en `/menu/[id]`)
- M06 — Generación e impresión de QRs: COMPLETED (deployado a https://bar-sharif.vercel.app; CA-008 verificado — la env `NEXT_PUBLIC_APP_URL` está seteada y el `og:url` del `/menu/[id]` en producción usa el dominio correcto, misma fuente que alimenta los QRs. `/admin/qrs/print` protegida por middleware — devuelve 307 a /admin/login sin sesión. Escaneo físico con móvil pendiente como validación humana opcional, no bloqueante técnicamente)
- M07 — Deploy en Vercel: COMPLETED (hecho fuera de orden como consecuencia de M03; url pública funcional)
- M08 — Hardening del admin (deuda post-MVP): COMPLETED (`requireAdmin()` protege todas las Server Actions mutantes; `sanitizeActionError()` traduce errores de Supabase a mensajes humanos y loguea el detalle server-side; banner en admin detecta y avisa si los sign-ups de Supabase siguen abiertos. CA-001 verificado en vivo: click sin sesión no muta la DB)
- M09 — Analytics de escaneos: COMPLETED (deployado a producción — dashboard `/admin/analytics` verificado en https://bar-sharif.vercel.app mostrando datos reales de `dish_views`: 3 escaneos del 22/08, tabla con los 4 platos)

## Estados válidos

```
PENDING · DISCOVERY · DESIGNING · AWAITING_APPROVAL ·
IN_PROGRESS · TESTING · COMPLETED · BLOCKED
```

## Deuda pendiente

- **✅ RESUELTO — `<model-viewer>` no se montaba en `/menu/[id]`.** Causa raíz: `loading.tsx` creaba un Suspense boundary cuyo streaming swap nunca completaba (bug de Next.js 16 + Turbopack con streaming en rutas dinámicas). Sin `loading.tsx`, la página hidrata correctamente y `useEffect` ejecuta. Además, Turbopack convierte `import("@google/model-viewer")` en un script tag cargando `/model-viewer.min.js` — se copió el bundle standalone (1.1MB, autocontenido con Three.js) de `node_modules/` a `public/`. Fix: eliminar `loading.tsx` + copiar `model-viewer.min.js` a `public/` + reescribir DishViewer con script tag explícito.
- **M03 TASK-008:** sign-ups OFF en Supabase Auth (acción manual del dueño en dashboard). Hoy sign-ups siguen ON — cualquiera podría autoregistrarse y quedaría con permisos `authenticated` (escritura sobre `dishes`/`categories`). Aplicar antes de anunciar la URL públicamente. **El banner de M08 ya está confirmado visible en producción** (`/admin/dishes` y `/admin/analytics`) recordando esta acción — desaparece solo cuando dilan lo desactive en el dashboard de Supabase.
- ~~**M04 gaps de seguridad conocidos**~~ ✅ **resuelto en M08:** mensajes sanitizados por `sanitizeActionError`, `requireAdmin()` como defense-in-depth en Server Actions, `deleteCategory` con guard de categoría-en-uso, banner de sign-ups en admin.
- **M04 pendiente de smoke test en producción:** CA-004 (upload real de foto a Storage) y CA-009 (rechazo RLS a un usuario anon) no se probaron explícitamente en el dominio público.
- **✅ M04→M05 resuelto:** M05 reemplazó el upload de `.glb` vía Server Action por upload directo browser→Storage, eliminando el límite de 4.5MB de Vercel Functions.

## Notas

- **Fuente de los `.glb`:** externa (el bar los escanea con RealityScan móvil, gratis). Nuestra app solo aloja + optimiza + muestra.
- **Optimización obligatoria:** los `.glb` crudos de RealityScan pesan 20–100 MB; Draco + texturas WebP los deja en un rango bastante menor (variable según contenido) para carga aceptable en 4G. KTX2 real queda fuera del MVP (ver SDD M05, sección "Decisión de arquitectura").
- **M01 no requiere SDD** (setup de infra, no funcionalidad de negocio). El resto de módulos sí.
- **Admin creado en Auth:** `dilanperea10@gmail.com` (password conocida por el dueño; ver memory reference `barsharif-supabase-proyecto`).
