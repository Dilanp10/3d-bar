# SDD — M02: Landing pública del plato

## 1. Identificación
Module: M02
Name: Landing pública del plato (`/menu/[id]`)
Status: Approved

## 2. Objetivo

Renderizar la página pública a la que apunta el QR de cada plato: un visor 3D interactivo del modelo `.glb` del plato junto con su nombre, descripción, precio y categoría, con estética moderna estilo bar-lounge oscuro. Incluir soporte PWA para instalación opcional. Es la primera ruta visible del proyecto y define la experiencia principal para el cliente del bar.

## 3. Alcance

### Incluye
- Ruta dinámica `/menu/[id]` (Server Component principal + Client Component para el visor).
- Componente `<DishViewer>` que envuelve `<model-viewer>` con auto-rotación, rotación con dedo/mouse, zoom por pellizco/scroll y botón AR nativo.
- Poster/thumbnail mostrado mientras descarga el `.glb`.
- Metadata dinámica (`title`, `description`, Open Graph, Twitter cards) para preview al compartir el link.
- Manifest.json + service worker mínimo → PWA instalable.
- Botón discreto "Instalar app" que aparece solo cuando el navegador dispara `beforeinstallprompt`.
- Página 404 amistosa (`not-found.tsx`) si el ID no existe o el plato está inactivo.
- Estado "modelo próximamente": plato existente pero `model_url = NULL` muestra foto grande + info + banner.
- Fallback si el navegador no soporta WebGL: mostrar solo la foto grande.
- Layout responsive mobile-first optimizado a 375 px.
- Data seed (2–3 platos + 1 `.glb` cargados a mano en Supabase) para poder desarrollar sin M04/M05.

### No incluye (queda fuera / es de otro módulo)
- Carga/edición de platos → M04.
- Autenticación → M03 (esta ruta es 100 % pública).
- Optimización del `.glb` al subirlo → M05 (aquí solo se consume el `.glb` ya alojado).
- Generación / impresión de QRs → M06.
- Estadísticas de escaneos, carrito, pedidos, pagos, multi-idioma → fuera del proyecto.

## 4. Requisitos funcionales

- **FR-001** — Al abrir `/menu/[id]` con un ID válido, mostrar nombre, precio, descripción y categoría del plato en menos de 2 s (perceived).
- **FR-002** — El visor 3D debe cargar el `.glb` referenciado en `dishes.model_url`, permitir rotación táctil/mouse, zoom por pellizco/scroll y auto-rotación por defecto que se pausa al primer input del usuario.
- **FR-003** — Si el dispositivo soporta AR (WebXR / Scene Viewer / Quick Look), `<model-viewer>` muestra automáticamente el botón "Ver en AR" que abre la experiencia AR nativa.
- **FR-004** — Si el ID no existe o `active=false`, la ruta responde HTTP 404 renderizando `not-found.tsx`.
- **FR-005** — Si el plato existe pero `model_url IS NULL`, se muestra la `photo_url` en formato grande + info + banner "Modelo 3D próximamente" (sin crash del visor).
- **FR-006** — La PWA es instalable: `manifest.json` con `name`, `short_name`, `icons` (192, 512, maskable), `theme_color`, `background_color`, `display: standalone`. Service worker mínimo con estrategia network-first para HTML y cache-first para assets estáticos.
- **FR-007** — Mientras se descarga el `.glb`, mostrar `thumbnail_url` como poster del visor + skeleton animado sobre el resto.
- **FR-008** — Meta Open Graph completas (`og:title`, `og:description`, `og:image`, `og:url`) para preview correcto en WhatsApp/Instagram/Twitter.
- **FR-009** — El botón "Instalar app" solo se muestra cuando el navegador emite `beforeinstallprompt`. Nunca aparece en dispositivos donde ya está instalada.

## 5. Requisitos no funcionales

- **NFR-001** — LCP ≤ 2.5 s en 4G (usando `thumbnail_url` como poster del visor mientras carga el `.glb`).
- **NFR-002** — JS de la ruta pública ≤ 200 KB gzip (sin contar el `.glb`, que se descarga aparte). `<model-viewer>` se carga vía import dinámico solo del lado cliente.
- **NFR-003** — Accesibilidad WCAG AA: contraste ≥ 4.5:1, botones con `aria-label`, foco visible, textos alternativos en imágenes.
- **NFR-004** — Mobile-first responsive, óptimo a 375 px de ancho, funcional hasta 1920 px.
- **NFR-005** — SSR (Server Component) para nombre/precio/foto → SEO y previews sociales. El visor 3D es Client Component (`"use client"`) por depender de WebGL.
- **NFR-006** — RLS: la consulta pública usa el `anon key` de Supabase; solo puede leer `dishes` con `active=true`. Nunca expone `service_role_key`.
- **NFR-007** — Navegadores objetivo: iOS Safari 15+, Chrome Android 100+, Safari macOS 15+, Chrome/Edge desktop 100+. Firefox soportado en modo degradado (sin AR).
- **NFR-008** — Estética: paleta oscura estilo bar-lounge (fondos `#0a0a0a`–`#1a1a1a`, acentos cálidos ámbar/dorado, tipografía sans moderna). Definir tokens en Tailwind config.

## 6. Arquitectura del módulo

```
src/app/
  menu/
    [id]/
      page.tsx              # Server Component — fetch, layout, metadata
      loading.tsx           # Suspense fallback (skeleton)
      not-found.tsx         # 404 amistoso
      DishViewer.tsx        # Client Component — envuelve <model-viewer>
      DishInfo.tsx          # Server Component — nombre / precio / desc / categoría
      InstallPWAButton.tsx  # Client Component — beforeinstallprompt

  layout.tsx                # (ya existe de M01) — agregar <link rel="manifest">

src/lib/
  db/
    dishes.ts               # getDishById(id) — Supabase server client + join category
  formatting/
    price.ts                # formatPrice(number) en ARS con Intl

src/components/
  ui/
    Skeleton.tsx
    Badge.tsx

public/
  manifest.webmanifest       # PWA manifest
  icons/                     # icon-192.png, icon-512.png, icon-maskable-512.png
  sw.js                      # service worker mínimo

tailwind.config / globals.css # tokens paleta bar-lounge
```

### Componentes y responsabilidades

| Componente | Tipo | Responsabilidad |
|---|---|---|
| `page.tsx` | Server | Fetchea el plato con `getDishById`, arma metadata (`generateMetadata`), renderiza el shell y compone `<DishViewer>` + `<DishInfo>`. Si `null` → `notFound()`. |
| `DishViewer` | Client | Import dinámico de `@google/model-viewer`, monta `<model-viewer>` con props (`src`, `poster`, `auto-rotate`, `camera-controls`, `ar`, `ar-modes`). Maneja fallback si WebGL no está disponible. |
| `DishInfo` | Server | Muestra nombre, precio formateado (`formatPrice`), descripción, badge de categoría. Sin estado. |
| `InstallPWAButton` | Client | Captura `beforeinstallprompt`, muestra botón discreto, dispara `prompt()`. |
| `not-found.tsx` | Server | Página 404 con branding del bar y link a "Volver a la carta" (cuando exista índice). |
| `loading.tsx` | Server | Skeleton visual mientras la ruta suspende. |

## 7. Flujo de datos

```
Cliente escanea QR
   → GET /menu/[id]
   → page.tsx (Server Component)
       → getDishById(id)              // src/lib/db/dishes.ts
           → supabase.from('dishes')
               .select('*, categories(name)')
               .eq('id', id)
               .eq('active', true)
               .maybeSingle()
       → si null → notFound()          // 404
       → si ok:
           generateMetadata()          // OG + title
           renderiza <DishInfo> (SSR)  // nombre, precio, desc
           renderiza <DishViewer>      // Client
   → HTML enviado al navegador (LCP con poster)
   → hidration
   → <model-viewer> descarga model_url (.glb) desde Supabase Storage
   → render 3D interactivo
   → usuario interactúa: rotate / zoom / AR / install PWA
```

## 8. Modelo de datos

Este módulo **solo lee**, no escribe. Tablas relevantes:

```sql
-- Ya definidas en el modelo global (ver PROJECT.md)
dishes (
  id uuid pk,
  name text not null,
  description text,
  price numeric(10,2) not null,
  category_id uuid references categories(id),
  photo_url text,
  model_url text,
  thumbnail_url text,
  sort_order int,
  active boolean default true,
  created_at timestamptz default now()
)

categories (
  id uuid pk,
  name text not null,
  sort_order int
)
```

Consulta base:
```sql
select d.*, c.name as category_name
from dishes d
left join categories c on c.id = d.category_id
where d.id = $1 and d.active = true
limit 1;
```

**RLS (a definir en M03/M04, dependencia downstream):** este módulo requiere que exista una policy `dishes_public_read` que permita `select` con `active = true` a rol `anon`. Se documenta como precondición en la sección 11.

**Data seed (temporal, solo para M02):** insertar 2–3 categorías + 3–4 platos + subir 1 `.glb` de ejemplo a Supabase Storage a mano vía dashboard. Marcarlo con etiqueta "SEED-M02" en el script SQL para poder borrarlo al llegar M04.

## 9. API

Este módulo **no expone endpoints HTTP propios**. Solo consume:

- **Supabase REST/PostgREST** vía `@supabase/ssr` con `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (RLS aplicado).
- **Supabase Storage (público)** para `model_url`, `photo_url`, `thumbnail_url`.

## 10. Seguridad

- **Input del usuario:** solo el `params.id` de la URL. Se pasa como argumento parametrizado al cliente Supabase (no concatenación de strings), lo que descarta inyección SQL.
- **RLS:** garantiza que solo se sirvan platos con `active = true`. Un ID no-uuid genera un error de tipo capturado y devuelto como 404.
- **Secretos:** esta ruta usa solo `NEXT_PUBLIC_*` (anon key). El `SUPABASE_SERVICE_ROLE_KEY` no se referencia en este módulo.
- **CSP (a definir en M07 pero previsto acá):** permitir `img-src`, `media-src` de Supabase Storage; permitir `blob:` y `data:` para el visor 3D; bloquear scripts externos.
- **Bucket Storage:** `models` y `photos` son públicos-lectura, escritura restringida al admin (se resuelve en M04/M05). No mezclar con datos privados.
- **Rate limiting:** Vercel Edge default es suficiente para MVP; no se implementa custom.
- **PWA / SW:** el service worker no cachea respuestas de Supabase (network-first para dinámico) para evitar servir datos stale.

## 11. Dependencias

### Módulos internos
- **M01 (COMPLETED)** — Next 16 + Tailwind + clientes Supabase + estructura base. Requerido.
- **M03 (PENDING)** — no bloqueante para desarrollar M02, pero la policy RLS `dishes_public_read` debe existir. **Acción:** en M02 creamos esa policy con una migración SQL inicial (`docs/sdd/M02-landing-plato/seed.sql`), aunque el resto de RLS de escritura se termine en M03.
- **M04 (PENDING)** — no bloqueante. Se usa data seed en su lugar. Al implementar M04 se borra el seed.
- **M05 (PENDING)** — no bloqueante. El `.glb` de seed se sube sin optimizar; en M05 se implementa la optimización real. Documentado en el seed.

### Librerías externas
- `@google/model-viewer` — ya instalado en M01.
- `@supabase/ssr` — ya instalado en M01.
- Ningún paquete nuevo.

## 12. Criterios de aceptación

- **CA-001** — `/menu/<id-existente>` en Chrome Android muestra el plato en 3D interactivo con nombre / descripción / precio en menos de 3 s (4G simulado).
- **CA-002** — `/menu/<id-inexistente>` responde HTTP 404 con la página 404 amistosa.
- **CA-003** — Compartir el link por WhatsApp genera preview con nombre del plato + `photo_url` como imagen.
- **CA-004** — En un iPhone con iOS 15+ se ve el botón "Ver en AR" y al tocarlo abre Quick Look con el `.glb` (o `.usdz` si lo servimos aparte — decisión de M05).
- **CA-005** — Un plato con `model_url = NULL` muestra la foto grande + info + banner "Modelo 3D próximamente" sin errores en consola.
- **CA-006** — Lighthouse mobile ≥ 85 Performance, ≥ 95 Accesibilidad, PWA ✓ instalable.
- **CA-007** — La ruta funciona sin autenticación; consultar la DB solo con `anon key` no expone platos `active=false`.
- **CA-008** — En Chrome desktop, tras la primera visita, el botón "Instalar app" aparece y al aceptarlo la PWA queda instalada como aplicación standalone.
- **CA-009** — Sin JavaScript (JS deshabilitado) el HTML inicial sigue mostrando la foto, nombre, descripción y precio (SSR verificado).
