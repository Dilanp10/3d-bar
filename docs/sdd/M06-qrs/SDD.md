# SDD — M06: Generación e impresión de QRs

## 1. Identificación
Module: M06
Name: Generación e impresión de QRs
Status: Approved

## 2. Objetivo
Permitir al admin generar el QR de cada plato — que apunta a `/menu/[id]` en producción — y disponerlo en formatos utilizables físicamente en el bar: descarga individual (PNG) para pegar en donde quieran, y una hoja imprimible con todos los platos activos (para imprimir de una y recortar). Sin persistir archivos en Storage: los QRs se generan on-demand en el browser.

## 3. Alcance

Incluye:
- Botón "QR" en cada fila de `/admin/dishes` que abre un modal/página con el QR del plato y opción de descargar PNG.
- Bloque "QR del plato" dentro de `/admin/dishes/[id]/edit` con vista previa + descarga.
- Página `/admin/qrs/print` que renderiza una grilla imprimible con el QR + nombre + precio de **todos los platos activos**, lista para `window.print()`.
- Botón "Imprimir todos los QRs" en `/admin/dishes` que abre esa página.
- URL del QR construida a partir de la env var pública `NEXT_PUBLIC_APP_URL` (misma que ya usa M02 para OpenGraph) + `/menu/[id]`.

No incluye:
- Guardar el QR en Storage o en columna de la DB (decisión: on-demand, ya validada).
- Generar PDF server-side (usamos `window.print()` — el dueño imprime a papel o "Guardar como PDF" desde el diálogo del navegador; cero dependencias nuevas).
- Estadísticas de escaneo del QR (fuera de MVP).
- Personalización visual del QR (logo embebido, colores custom, etc.).
- QRs para categorías o para el menú general (solo por plato).

## 4. Requisitos funcionales

- FR-001 — El sistema debe generar un QR que codifique `${NEXT_PUBLIC_APP_URL}/menu/${dish.id}` para cualquier plato existente.
- FR-002 — El admin debe poder descargar el QR de un plato individual como PNG (ancho fijo ≥ 512px, margen blanco incluido) con nombre `qr-<slug del plato>.png`.
- FR-003 — El admin debe poder abrir una hoja imprimible con los QRs de todos los platos con `active = true`, cada uno acompañado por el nombre del plato y el precio.
- FR-004 — La hoja imprimible debe estar optimizada para papel A4 con márgenes razonables (~1cm), grilla que aproveche el ancho, y cada QR con tamaño mínimo escaneable (≥ 3cm × 3cm impreso).
- FR-005 — Si no hay platos activos, la página de impresión debe mostrar un mensaje claro ("No hay platos activos para imprimir") en vez de una hoja vacía.
- FR-006 — El acceso a la generación de QRs debe estar restringido al admin autenticado (heredado de M03 via `/admin/*` layout).

## 5. Requisitos no funcionales

- NFR-001 — Generación 100% client-side con la librería `qrcode` (ya instalada). No pasa por Server Actions ni edge functions.
- NFR-002 — No debe haber estado persistido para los QRs: no se guarda nada en DB ni en Storage. Si cambia `NEXT_PUBLIC_APP_URL`, todos los QRs futuros salen con la URL nueva sin migración.
- NFR-003 — La página de impresión debe cargar en < 3s con hasta 50 platos activos (nivel esperado en un bar chico).
- NFR-004 — El PNG descargado debe ser escaneable por lectores QR estándar de iOS/Android a 3cm de distancia con impresión doméstica.

## 6. Arquitectura del módulo

**Componentes nuevos:**
- `src/lib/qr/generate.ts` — helper `generateQrPng(text, size)` que devuelve un `dataUrl` (usa `QRCode.toDataURL` de la lib `qrcode`) + helper `generateQrCanvas(canvas, text, size)` para renderizar directo en un `<canvas>`. Puro cliente.
- `src/lib/qr/url.ts` — helper `dishMenuUrl(dishId)` que arma la URL leyendo `NEXT_PUBLIC_APP_URL` (fallback a `window.location.origin` si no está definida, y a `''` en SSR — el componente que lo usa es Client, así que en producción siempre resuelve).
- `src/app/admin/dishes/QrButton.tsx` — Client Component: botón "QR" en la fila del listado que abre un modal (dialog nativo `<dialog>` o componente propio) con la vista previa del QR + botón "Descargar PNG".
- `src/app/admin/dishes/QrBlock.tsx` — Client Component: bloque reusable con canvas + botón descarga, para embeber en la página de edición.
- `src/app/admin/qrs/print/page.tsx` — Server Component que lee todos los platos activos desde Supabase (server client) y pasa la lista a un Client Component…
- `src/app/admin/qrs/print/PrintSheet.tsx` — Client Component que renderiza la grilla, corre `generateQrCanvas` para cada plato, y expone un botón "Imprimir" que dispara `window.print()`.
- CSS `@media print` en la propia página de impresión: oculta el botón "Imprimir", oculta el nav del admin (o directamente la ruta usa un layout mínimo), grilla fija.

**Componentes modificados:**
- `src/app/admin/dishes/page.tsx` — agregar botón "Imprimir todos los QRs" en el header y usar `<QrButton dishId={...} dishName={...} />` en cada fila (probablemente dentro de `DishActions.tsx`).
- `src/app/admin/dishes/[id]/edit/page.tsx` — insertar `<QrBlock dishId={...} dishName={...} />` en algún costado del form.

**Layout de la ruta de impresión:**
- `src/app/admin/qrs/print/layout.tsx` — layout mínimo que **no** hereda del admin (o lo hereda pero con clase que en `@media print` oculta el nav). Preferencia: layout propio que solo renderice `{children}` para que la hoja impresa salga limpia.

## 7. Flujo de datos

**Descarga individual:**
```
Admin click "QR" en fila
  → QrButton abre modal
  → QrBlock corre generateQrCanvas(canvas, dishMenuUrl(id), 512)
  → click "Descargar" → canvas.toBlob → saveAs → qr-<slug>.png
```

**Impresión masiva:**
```
Admin click "Imprimir todos los QRs" en /admin/dishes
  → navega a /admin/qrs/print
  → Server Component: SELECT * FROM dishes WHERE active = true ORDER BY sort_order
  → pasa lista a PrintSheet (Client)
  → PrintSheet: por cada plato, useEffect genera QR en <canvas>
  → click "Imprimir" → window.print()
  → CSS @media print oculta botón y renderiza solo la grilla
```

## 8. Modelo de datos
Sin cambios. Se leen columnas ya existentes de `dishes`: `id`, `name`, `price`, `active`, `sort_order`.

## 9. API
Sin cambios (no hay endpoints nuevos, no hay Server Actions nuevas — todo client-side sobre datos ya expuestos por lectura pública de `dishes`).

## 10. Seguridad

- El acceso a `/admin/qrs/print` y a los botones dentro de `/admin/dishes` está protegido por el middleware/layout de M03 (redirect a `/admin/login` si no hay sesión).
- **Nota:** las URLs `/menu/[id]` que codifica el QR son intencionalmente públicas (RLS pública ya existente). No exponen información sensible — apuntan a la landing pública del plato.
- La env var `NEXT_PUBLIC_APP_URL` es pública por diseño (viaja al cliente); debe apuntar a `https://3d-bar.vercel.app` en producción.

## 11. Dependencias

Módulos:
- M02 (landing pública `/menu/[id]`) — COMPLETED — el QR apunta ahí.
- M03 (auth admin) — COMPLETED — protege el acceso.
- M04 (CRUD platos) — COMPLETED — provee la lista de platos.
- M07 (deploy Vercel) — COMPLETED — provee la URL pública que va en el QR.

Librerías:
- `qrcode` (^1.5.4) — ya instalada, no se agrega nada nuevo.

Config:
- `NEXT_PUBLIC_APP_URL` — env var (ya usada por M02). Actualmente **no está seteada en Vercel** — hay que agregarla a producción apuntando a `https://3d-bar.vercel.app`. En `.env.local` ya está para desarrollo.

## 12. Criterios de aceptación

- CA-001 — Desde `/admin/dishes`, click en "QR" de un plato abre un modal con el QR visible; al escanearlo con un móvil real, abre `/menu/<ese-id>` en producción.
- CA-002 — El botón "Descargar PNG" descarga un archivo `qr-<slug>.png` de al menos 512×512 con margen blanco.
- CA-003 — Desde `/admin/dishes/[id]/edit`, el bloque QR se ve renderizado junto al form y su botón de descarga funciona.
- CA-004 — Click en "Imprimir todos los QRs" navega a `/admin/qrs/print` y renderiza la grilla con todos los platos activos.
- CA-005 — `window.print()` (o Ctrl+P) muestra una vista imprimible **sin** el nav del admin ni el botón "Imprimir", con los QRs escalados a ≥ 3cm y el nombre + precio debajo de cada uno.
- CA-006 — Si `active = false` para todos los platos, la página muestra el mensaje "No hay platos activos para imprimir".
- CA-007 — Un usuario no autenticado que intente entrar a `/admin/qrs/print` es redirigido a `/admin/login` (comportamiento heredado de M03).
- CA-008 — La URL codificada usa `NEXT_PUBLIC_APP_URL` y no `localhost` en producción (verificado en el deploy real).
