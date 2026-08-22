# Tasks — M06: Generación e impresión de QRs

Fuente: [SDD.md](./SDD.md) (Approved)

## TASK-001 — Setear `NEXT_PUBLIC_APP_URL` en Vercel producción
Status: COMPLETED
Satisfies: NFR-002, CA-008

Descripción:
Agregar la env var `NEXT_PUBLIC_APP_URL=https://bar-sharif.vercel.app` en Vercel para el ambiente Production (ya está en `.env.local` para desarrollo; ya la usa M02 para OpenGraph).

Completed:
- `vercel env add NEXT_PUBLIC_APP_URL production` con valor `https://bar-sharif.vercel.app`. Confirmado con `vercel env ls`.
- El redeploy queda pendiente al final del módulo — necesita autorización del usuario (auto mode bloqueó `vercel --prod`).

SDD requirements satisfied:
- NFR-002 (fuente única de la URL en env var). CA-008 pendiente de validación en el deploy real.

## TASK-002 — Helpers `qr/url.ts` y `qr/generate.ts`
Status: COMPLETED
Satisfies: FR-001, NFR-001

Descripción:
Crear `src/lib/qr/url.ts` con `dishMenuUrl(dishId)` que lee `process.env.NEXT_PUBLIC_APP_URL` con fallback a `window.location.origin`. Crear `src/lib/qr/generate.ts` con `generateQrDataUrl(text, size)` y `generateQrOnCanvas(canvas, text, size)` usando la lib `qrcode`. Margen blanco incluido, `errorCorrectionLevel: "M"`.

Completed:
- `siteOrigin()` normaliza trailing slashes; fallback a `window.location.origin` en client, string vacío en SSR (los componentes que lo llaman son Client Components, así que en runtime resuelve).
- `dishMenuUrl(id)` compone `${origin}/menu/${id}`.
- `generateQrDataUrl` y `generateQrOnCanvas` como wrappers sobre `QRCode.toDataURL`/`toCanvas` con opciones base compartidas (M correction level, margin 2, negro/blanco).
- `@types/qrcode` instalado como devDep — la lib no trae types propios. `qrcode` ya tenía `browser` field en package.json redirigiendo a `lib/browser.js`, así que el bundler de Next lo maneja transparentemente (sin `fs` en el bundle client).

Files:
- src/lib/qr/url.ts
- src/lib/qr/generate.ts
- package.json / package-lock.json (`@types/qrcode` devDep)

SDD requirements satisfied:
- FR-001, NFR-001

## TASK-003 — Componente `QrBlock` (vista previa + descarga PNG)
Status: COMPLETED
Satisfies: FR-002, CA-002, CA-003

Descripción:
`QrBlock` reusable con canvas + URL visible + botón "Descargar PNG" que exporta como `qr-<slug>.png`.

Completed:
- Client Component. `useEffect` corre `generateQrOnCanvas` al montar. Muestra la URL debajo del QR (útil para debugging y para que el admin vea a dónde apunta).
- Descarga vía `canvas.toBlob → URL.createObjectURL → <a download>` — el archivo se guarda con nombre `qr-<slug>.png` (slug: lowercase, sin acentos, espacios → guiones).
- Error tipado: si `generateQrOnCanvas` falla, muestra el mensaje debajo del canvas en vez de romper.

Files:
- src/app/admin/dishes/QrBlock.tsx

SDD requirements satisfied:
- FR-002, CA-002, CA-003

## TASK-004 — Botón "QR" en el listado de platos (modal)
Status: COMPLETED
Satisfies: FR-002, CA-001

Descripción:
Botón "QR" en la fila del listado que abre un `<dialog>` nativo con `<QrBlock />` adentro.

Completed:
- `QrButton` usa `<dialog>` nativo con `showModal()` — modal accesible, cierre con ESC nativo, click en backdrop cierra (handler `onClick` que compara target === dialog).
- `DishActions.tsx` extendido para recibir `name` además de `id`+`active`, y renderizar `<QrButton>` a la izquierda del resto de acciones.
- `dishes/page.tsx` pasa `dish.name` al DishActions.

Files:
- src/app/admin/dishes/QrButton.tsx
- src/app/admin/dishes/DishActions.tsx (modificado — nueva prop `name`)
- src/app/admin/dishes/page.tsx (modificado — pasa `name`)

SDD requirements satisfied:
- FR-002, CA-001

## TASK-005 — Bloque QR embebido en la página de edición
Status: COMPLETED
Satisfies: FR-002, CA-003

Descripción:
Insertar `<QrBlock>` en el layout del edit page, al costado del form.

Completed:
- `edit/page.tsx` envuelve `<DishForm>` + `<aside>` con `<QrBlock>` en un grid `[1fr_auto]` en desktop (columna aparte, sticky), y stack vertical en mobile.
- Reusa el mismo `QrBlock` que el modal — un solo componente para las dos vistas.

Files:
- src/app/admin/dishes/[id]/edit/page.tsx (modificado)

SDD requirements satisfied:
- FR-002, CA-003

## TASK-006 — Página `/admin/qrs/print` (Server + Client)
Status: COMPLETED
Satisfies: FR-003, FR-005, CA-004, CA-006

Descripción:
Server Component que lee platos activos + Client Component que renderiza la grilla con canvases.

Completed:
- Decisión de arquitectura: **no** se creó un layout separado. La ruta hereda el layout de admin (nav + auth), y el CSS `@media print` oculta el chrome. Motivo: escapar del layout de admin requiere route groups (`(no-chrome)/admin/qrs/print`) que complican el matcher del middleware; con CSS es equivalente y más simple. El nav sigue disponible mientras el usuario navega, se oculta solo al imprimir.
- `page.tsx` (Server): `SELECT id, name, price FROM dishes WHERE active = true ORDER BY sort_order`. Si vacío, renderiza mensaje "No hay platos activos para imprimir" + link volver.
- `PrintSheet.tsx` (Client): grid responsive (2 cols mobile → 4 cols desktop), cada `QrCard` con canvas 512px + nombre + precio formateado. Botón "Imprimir" dispara `window.print()`.

Files:
- src/app/admin/qrs/print/page.tsx
- src/app/admin/qrs/print/PrintSheet.tsx

SDD requirements satisfied:
- FR-003, FR-005, CA-004, CA-006

## TASK-007 — CSS `@media print`
Status: COMPLETED
Satisfies: FR-004, CA-005, NFR-004

Descripción:
Estilos scoped a la página de impresión: A4, margen 1cm, ocultar nav y botones.

Completed:
- `<style dangerouslySetInnerHTML>` inline dentro de `PrintSheet.tsx`. Se monta cuando el usuario entra a la ruta, se desmonta al salir — no contamina otras páginas.
- Reglas: `@page A4 margin 1cm`, `body > div > nav` y `.no-print` `display: none`, `main` sin max-width/padding/margin, blanco/negro forzado, `break-inside: avoid` en cada card.
- Verificado en dev: `@media print` cargó como single rule con 8 innerRules, todos los selectores matchean elementos reales del DOM (`sheet.cssRules[0].cssRules`).

Files:
- src/app/admin/qrs/print/PrintSheet.tsx (bloque `PRINT_CSS`)

SDD requirements satisfied:
- FR-004, CA-005, NFR-004

## TASK-008 — Botón "Imprimir todos los QRs" en `/admin/dishes`
Status: COMPLETED
Satisfies: FR-003, CA-004

Descripción:
Link en el header del listado a `/admin/qrs/print`.

Completed:
- Header de `/admin/dishes` ahora tiene dos botones lado a lado: "Imprimir todos los QRs" (secundario, borde) + "+ Nuevo plato" (primario, accent).

Files:
- src/app/admin/dishes/page.tsx (modificado — header con dos botones)

SDD requirements satisfied:
- FR-003, CA-004

## TASK-009 — Verificación end-to-end
Status: PARTIAL
Satisfies: CA-001, CA-002, CA-004, CA-005, CA-006, CA-007, CA-008

Descripción:
Verificación en browser real + producción.

Completed en dev (localhost:3000):
- **CA-001** ✓ — `/admin/dishes` renderiza los 4 `<QrButton>` correctos; los 4 `<dialog>` con QrBlock están en el DOM. Los 4 canvases de 320×320 tienen contenido oscuro en el centro (34–70% de pixels oscuros en un sample 16×16, distinto por plato porque codifican URLs diferentes). Sin errores en consola.
- **CA-002** ✓ — botón "Descargar PNG" presente en cada modal (test de download real bloqueado por browser automatizado, pero la lógica `canvas.toBlob → <a download>` es estándar y compila).
- **CA-003** ✓ — verificado en `/admin/dishes/[id]/edit` durante la implementación (renderiza QrBlock al costado del form).
- **CA-004** ✓ — link "Imprimir todos los QRs" en `/admin/dishes` navega a `/admin/qrs/print`; página renderiza 4 canvas de 512×512 con QRs reales (30–46% pixels oscuros en sample central) + nombre + precio de cada plato.
- **CA-005** ✓ — CSS `@media print` cargado como `CSSMediaRule` con 8 reglas internas, todos los selectores matchean DOM: nav (`body > div > nav`), `.no-print` (1 elemento), `main`, `.qr-grid`, 4 `.qr-card`. Al imprimir el navegador aplica todas.
- **CA-006** ✓ — código server component chequea `!dishes || dishes.length === 0` y renderiza mensaje "No hay platos activos para imprimir" + link volver (verificación por code review — desactivar todos los platos y revertir era más invasivo que el beneficio; la rama es trivial).
- **CA-007** ✓ — protegido por middleware existente de M03 (matcher `/admin/:path*` redirige a `/admin/login` si no hay `user`). Sin cambios necesarios.
- **Build de producción:** `npm run build` completa limpio, ruta `/admin/qrs/print` aparece en el manifest como `ƒ` (dinámica).

Pendiente:
- **CA-008** — validar en producción con `NEXT_PUBLIC_APP_URL` seteada. Requiere redeploy con `vercel --prod` (auto mode del harness bloqueó el comando — el usuario tiene que autorizarlo o correrlo).
- **Escaneo con móvil real** — el QR generado en dev codifica `http://localhost:3000/menu/[id]`; en producción codificará `https://bar-sharif.vercel.app/menu/[id]`. Escanear uno con la cámara del móvil es la prueba final.

Files:
- (verificación — no toca código de producción)

SDD requirements satisfied:
- CA-001, CA-002, CA-003, CA-004, CA-005, CA-006, CA-007. CA-008 pendiente redeploy + escaneo móvil.
