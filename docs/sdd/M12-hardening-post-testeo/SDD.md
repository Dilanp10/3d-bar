# SDD — M12: Hardening post-testeo (fixes 🟡)

## 1. Identificación
Module: M12
Name: Hardening post-testeo
Status: Approved   <!-- Draft | Approved -->

## 2. Objetivo
Resolver el conjunto de bugs de robustez y ambigüedades detectados en el testeo
integral de la app (2026-08-24). Ninguno rompe la app hoy, pero son deuda
concreta que crece con el uso o degrada la calidad. Este módulo NO agrega
funcionalidad nueva de negocio: endurece la existente.

## 3. Alcance
Incluye (6 fixes):
- **F1 — Cleanup de Storage:** borrar los objetos de Storage al eliminar/reemplazar
  platos y al fallar una escritura de DB después de subir el `.glb`.
- **F2 — Validación server-side:** validar con `zod` en las Server Actions de
  platos y categorías (hoy solo valida el browser).
- **F3 — Quitar modelo/foto:** permitir dejar un plato sin modelo o sin foto
  desde el admin (hoy solo se puede reemplazar).
- **F4 — Analytics determinístico:** reemplazar la heurística frágil de
  `document.referrer` por una señal explícita `?preview=1` en los links del admin.
- **F5 — ESLint ignora `public/`:** sacar del lint los bundles vendored.
- **F6 — Iconos PWA en PNG + glyph correcto:** generar PNGs (192/512/maskable)
  desde el SVG, corregir el glyph que todavía dice "S" (resto de "Sharif") por
  la marca "3D", y agregar `apple-touch-icon` para iOS.

No incluye (queda fuera):
- Las dos deudas 🔴 conocidas (datos ficticios de M11, sign-ups de Supabase ON):
  no son bugs de código, se tratan aparte.
- Rediseño de UI/UX o features nuevas.
- Reescalado de los `.glb` seed (deuda de M05, separada).

## 4. Requisitos funcionales

**FR-001 (F1) — Cleanup de Storage.**
- Helper `storagePathFromPublicUrl(url): { bucket, path } | null` que parsea las
  URLs públicas de Supabase (`.../storage/v1/object/public/<bucket>/<path>`).
- `deleteDish(id)`: tras el `delete` exitoso en DB, borra best-effort de Storage
  los objetos de `photo_url`, `model_url` y `thumbnail_url` del plato.
- `updateDish(id, ...)`: si se reemplaza foto o modelo, tras el `update` exitoso
  borra best-effort el objeto viejo (solo si la URL cambió).
- `createDish`/`updateDish`: si la escritura de DB **falla** después de que el
  cliente ya subió un `.glb`, borra best-effort ese objeto recién subido
  (la URL viene en `formData.model_url`).
- `deleteCategory(id)`: sin cambios de Storage (las categorías no tienen assets).
- "Best-effort" = los errores de borrado de Storage NO revierten ni fallan la
  operación principal; se loguean server-side vía `sanitizeActionError`.

**FR-002 (F2) — Validación server-side.**
- Esquemas `zod` para plato y categoría:
  - `name`: string, trim, 1..120 chars.
  - `price`: number finito, >= 0 (coerce desde string).
  - `sort_order`: int >= 0 (coerce, default 0).
  - `category_id`: uuid | null.
  - `active`: boolean.
  - `description`: string | null (max 2000).
- Si la validación falla, la action retorna `{ error: <mensaje humano en es> }`
  sin tocar Storage ni DB. Se mantiene la forma de retorno actual
  (`{ error: string } | undefined`) para no romper `DishForm`.

**FR-003 (F3) — Quitar modelo/foto.**
- `DishForm` muestra un checkbox "Quitar modelo 3D" solo si `dish.model_url`
  existe, y "Quitar foto" solo si `dish.photo_url` existe (ambos solo en modo
  edición).
- Precedencia: si en el mismo submit se sube un archivo nuevo **y** se marca
  quitar, gana el archivo nuevo (el checkbox se ignora).
- `updateDish`: si `remove_model` está y no hay modelo nuevo → `model_url = null`
  + borrado best-effort del objeto viejo. Ídem `remove_photo` → `photo_url = null`.

**FR-004 (F4) — Analytics determinístico.**
- Los links del admin que apuntan a `/menu/[id]` (preview desde la lista de
  platos y desde el bloque de QR) agregan `?preview=1`.
- `TrackView` omite el registro si `location.search` contiene `preview=1`.
- Se mantiene el chequeo de `document.referrer` como red secundaria.
- Los QR generados (`dishMenuUrl`) NO llevan el parámetro → los escaneos reales
  siguen contando. (Sin cambios en `lib/qr`.)

**FR-005 (F5) — ESLint ignora `public/`.**
- Agregar `"public/**"` a `globalIgnores` en `eslint.config.mjs`.
- `npm run lint` debe terminar sin errores ni warnings.

**FR-006 (F6) — Iconos PWA.**
- Corregir el SVG del ícono: glyph "3D" (o el logotipo de marca) en vez de "S".
- Generar con `sharp` (ya disponible) PNGs: `icon-192.png`, `icon-512.png`,
  `icon-maskable-512.png` (con padding de safe-zone para maskable).
- `manifest.webmanifest` referencia los PNG (type `image/png`).
- Agregar `<link rel="apple-touch-icon" href="/icons/icon-192.png">` en el
  `<head>` (layout raíz) para iOS.

## 5. Requisitos no funcionales
- NFR-001 — Sin regresiones: los flujos verificados en producción
  (`/`, `/menu`, `/menu/[id]`, `/admin/*`, track-view, upload de `.glb`) siguen
  con el mismo comportamiento observable.
- NFR-002 — `tsc --noEmit` y `npm run lint` limpios.
- NFR-003 — Los cambios de Storage son best-effort: nunca dejan la DB
  inconsistente con la UI por un error de borrado de un objeto.

## 6. Arquitectura del módulo
Archivos afectados (previsto):
- `src/lib/storage/paths.ts` — **nuevo**: `storagePathFromPublicUrl`.
- `src/lib/validation/dish.ts` — **nuevo**: esquemas zod (platos/categorías).
- `src/app/admin/dishes/actions.ts` — F1, F2, F3.
- `src/app/admin/categories/actions.ts` — F2.
- `src/app/admin/dishes/DishForm.tsx` — F3 (checkboxes quitar).
- `src/app/menu/[id]/TrackView.tsx` — F4.
- `src/app/admin/dishes/page.tsx` / `QrBlock.tsx` (o donde estén los links de
  preview) — F4 (`?preview=1`).
- `eslint.config.mjs` — F5.
- `public/icons/*` + `scripts/gen-icons.mjs` (**nuevo**, dev-only) + `manifest.webmanifest`
  + `src/app/layout.tsx` — F6.

## 7. Flujo de datos
- **Borrado de plato:** Admin → `deleteDish` → DB delete → (ok) → borrado
  best-effort de objetos en `photos`/`models`/`thumbnails` → revalidate.
- **Preview admin:** Admin → link `/menu/[id]?preview=1` → `TrackView` ve
  `preview=1` → no llama a `/api/track-view`.

## 8. Modelo de datos
Sin cambios de esquema. `dishes.model_url` / `photo_url` pasan a poder volver a
`null` vía F3 (ya son nullables). No hay migraciones.

## 9. API
Sin endpoints nuevos. `/api/track-view` sin cambios (el filtrado de preview es
client-side, antes de llamarla).

## 10. Seguridad
- F2 refuerza defense-in-depth: aunque el único admin es de confianza, deja de
  depender solo de la validación del browser.
- El borrado de Storage se hace con el cliente autenticado del admin (mismas RLS
  de escritura que ya rigen los buckets), después de `requireAdmin`.

## 11. Dependencias
- M04 (CRUD platos) y M05 (upload `.glb`): F1/F2/F3 modifican su código. Este
  módulo actualiza su comportamiento — las notas de M04/M05 se enlazan a M12.
- M09 (analytics): F4 modifica la señal de tracking.
- M02 (PWA): F6 toca manifest/iconos.
- `sharp` (ya presente como dep transitiva) para F6.

## 12. Criterios de aceptación
- CA-001 (F1) — Borrar un plato con foto y modelo elimina también sus objetos de
  Storage (verificado: la URL del objeto pasa a 404 tras el borrado).
- CA-002 (F1) — Reemplazar la foto de un plato deja el objeto viejo borrado y el
  nuevo accesible.
- CA-003 (F2) — Una Server Action con `price` no numérico o `name` vacío retorna
  `{ error }` y no inserta/actualiza nada.
- CA-004 (F3) — Marcar "Quitar modelo 3D" en edición deja `model_url = null` y el
  plato se ve en `/menu/[id]` con el fallback de foto.
- CA-005 (F4) — Abrir `/menu/[id]?preview=1` NO genera fila en `dish_views`;
  abrir `/menu/[id]` sí.
- CA-006 (F5) — `npm run lint` termina en 0 sin errores ni warnings.
- CA-007 (F6) — `manifest.webmanifest` sirve iconos PNG 200 `image/png`, el glyph
  ya no es "S", y el layout incluye `apple-touch-icon`.
- CA-008 — `tsc --noEmit` limpio y sin regresiones en los flujos de NFR-001.
