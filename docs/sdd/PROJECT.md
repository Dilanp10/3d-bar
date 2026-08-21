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
- M05 — Upload y optimización de `.glb`: COMPLETED (pipeline Draco+WebP client-side funcionando, verificada end-to-end con un `.glb` sintético de ~40k triángulos: optimiza, sube a Storage, crea el plato. La única CA no verificable — ver visor en `/menu/[id]` — está bloqueada por un bug de M02, no de M05, ver deuda pendiente)
- M06 — Generación e impresión de QRs: PENDING (depende de M04)
- M07 — Deploy en Vercel: COMPLETED (hecho fuera de orden como consecuencia de M03; url pública funcional)

## Estados válidos

```
PENDING · DISCOVERY · DESIGNING · AWAITING_APPROVAL ·
IN_PROGRESS · TESTING · COMPLETED · BLOCKED
```

## Deuda pendiente

- **🔴 M02 — `<model-viewer>` nunca se monta, en NINGÚN plato (hallazgo crítico, bloquea el feature central de la app).** Descubierto durante la verificación end-to-end de M05, con infra real por primera vez. Nombre/precio/descripción renderizan bien (SSR verificado); el chunk principal de `@google/model-viewer` carga (200 OK) pero es un loader-stub de Turbopack que debe pedir 6 chunks más (Three.js core/examples/etc.) — esos 6 nunca se solicitan en el browser, aunque son servibles individualmente por curl. Probado en 2 platos distintos (uno con modelo real recién optimizado por M05, uno con la data seed de M02) — mismo resultado en ambos, así que es un problema de `DishViewer.tsx`/carga del bundle, no del contenido del `.glb`. El propio `TASKS.md` de M02 ya había dejado esto como "Pendiente (requiere infra Supabase real)" — ahora que existe esa infra, quedó expuesto. **Recomendado: investigar y arreglar esto antes de M06 (QRs)** — no tiene sentido imprimir QRs que llevan a un visor 3D roto.
- **M03 TASK-008:** sign-ups OFF en Supabase Auth (acción manual del dueño en dashboard). Hoy sign-ups siguen ON — cualquiera podría autoregistrarse y quedaría con permisos `authenticated` (escritura sobre `dishes`/`categories`). Aplicar antes de anunciar la URL públicamente.
- **M04 gaps de seguridad conocidos** (aceptados al aprobar el SDD, ver sección 10): mensajes de error sin sanitizar (leak de detalles de Postgres/Storage al admin), Server Actions sin re-check explícito de sesión (confían en middleware+layout de M03), `deleteCategory` sin validar si hay platos usándola antes de borrar.
- **M04 pendiente de smoke test en producción:** CA-004 (upload real de foto a Storage) y CA-009 (rechazo RLS a un usuario anon) no se probaron explícitamente en el dominio público.
- **M04→M05 (hallazgo crítico):** el flujo actual de M04 sube el `.glb` como `File` vía Server Action — esto **falla** para cualquier archivo real de RealityScan (20–100 MB) porque Vercel Functions rechaza payloads > 4.5 MB (`FUNCTION_PAYLOAD_TOO_LARGE`). M05 reemplaza ese path por upload directo browser→Storage. Hasta que M05 esté implementado, subir un `.glb` grande real desde `/admin/dishes/new` en producción falla.

## Notas

- **Fuente de los `.glb`:** externa (el bar los escanea con RealityScan móvil, gratis). Nuestra app solo aloja + optimiza + muestra.
- **Optimización obligatoria:** los `.glb` crudos de RealityScan pesan 20–100 MB; Draco + texturas WebP los deja en un rango bastante menor (variable según contenido) para carga aceptable en 4G. KTX2 real queda fuera del MVP (ver SDD M05, sección "Decisión de arquitectura").
- **M01 no requiere SDD** (setup de infra, no funcionalidad de negocio). El resto de módulos sí.
- **Admin creado en Auth:** `dilanperea10@gmail.com` (password conocida por el dueño; ver memory reference `barsharif-supabase-proyecto`).
