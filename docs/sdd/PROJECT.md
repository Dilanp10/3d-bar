# Estado del proyecto — Bar Sharif Menu 3D

App para el Bar Sharif donde cada plato de la carta tiene un QR que, al escanearse, abre una URL con el plato en 3D interactivo. Un admin único (dueño del bar) carga los platos con sus modelos `.glb` generados afuera con RealityScan.

## Arquitectura

**Cliente (público):** escanea QR → URL `https://<dominio>/menu/[id]` → landing con `<model-viewer>` cargando `.glb` optimizado + info del plato. PWA opcional (instalable).

**Admin (login único):** panel en `/admin/*` → carga foto + datos + `.glb` de RealityScan → backend optimiza `.glb` con Draco+KTX2 → guarda en Supabase Storage → genera QR imprimible.

### Stack
- **Frontend:** Next.js 15 (App Router) + Tailwind
- **3D:** `<model-viewer>` de Google (WebComponent, AR nativo iOS/Android)
- **Backend/DB/Auth/Storage:** Supabase (Postgres + Auth email/pass + Storage)
- **Optimización .glb:** `@gltf-transform/core` + `@gltf-transform/functions` (Node, sin GPU)
- **QRs:** `qrcode` (npm)
- **Deploy:** Vercel

### Modelo de datos
```
categories (id, name, sort_order)
dishes (id, name, description, price, category_id,
        photo_url, model_url, thumbnail_url,
        sort_order, active, created_at)
```
RLS: lectura pública en `dishes`/`categories`; escritura solo admin autenticado.

### Flujos clave
- **Admin carga plato:** foto + datos + .glb → API Route optimiza → Supabase Storage → DB → QR listo.
- **Cliente escanea:** QR → `/menu/[id]` → visor 3D + info + botón PWA opcional.

## Módulos

- M01 — Setup del proyecto: COMPLETED
- M02 — Landing pública del plato (`/menu/[id]`): PENDING
- M03 — Autenticación del admin: PENDING
- M04 — Gestión de platos (CRUD sin 3D): PENDING (depende de M03)
- M05 — Upload y optimización de `.glb`: PENDING (depende de M04)
- M06 — Generación e impresión de QRs: PENDING (depende de M04)
- M07 — Deploy en Vercel: PENDING (depende de todos)

## Estados válidos

```
PENDING · DISCOVERY · DESIGNING · AWAITING_APPROVAL ·
IN_PROGRESS · TESTING · COMPLETED · BLOCKED
```

## Notas

- **Fuente de los `.glb`:** externa (el bar los escanea con RealityScan móvil, gratis). Nuestra app solo aloja + optimiza + muestra.
- **Optimización obligatoria:** los `.glb` crudos de RealityScan pesan 20–100 MB; Draco+KTX2 los deja en 1–5 MB para carga aceptable en 4G.
- **M01 no requiere SDD** (setup de infra, no funcionalidad de negocio). El resto de módulos sí.
