# Tasks — M12: Hardening post-testeo

Fuente: SDD.md (Approved)

## TASK-001 — Helper de path de Storage + cleanup en delete/replace
Status: COMPLETED
Satisfies: FR-001

Descripción:
Crear `src/lib/storage/paths.ts` con `storagePathFromPublicUrl`. Aplicar borrado
best-effort de objetos en `deleteDish` (foto/modelo/thumbnail), en `updateDish`
(objeto viejo cuando se reemplaza), y en `create/updateDish` cuando la escritura
de DB falla tras subir un `.glb`.

Completed:
- Nuevo helper `storagePathFromPublicUrl` (parsea `.../public/<bucket>/<path>`) +
  `removeStorageObjects` (agrupa por bucket, best-effort, loguea errores sin
  propagarlos).
- `deleteDish`: captura URLs vía `getDishById` antes de borrar la fila, luego
  limpia foto/modelo/thumbnail.
- `updateDish`: al reemplazar/quitar, borra el objeto viejo tras el update OK; si
  el update falla, borra lo recién subido en ese submit.
- `createDish`: si el insert falla, borra la foto (server-side) y el `.glb`
  (client-side) recién subidos.

Files:
- src/lib/storage/paths.ts (nuevo)
- src/app/admin/dishes/actions.ts

Tests:
- tsc + lint + build limpios. CA-001/CA-002 (borrado real de objetos) pendiente de
  smoke test en deploy.

SDD requirements satisfied:
- FR-001

## TASK-002 — Validación server-side con zod (platos y categorías)
Status: COMPLETED
Satisfies: FR-002

Descripción:
Crear `src/lib/validation/dish.ts` con esquemas zod. Validar en `createDish`,
`updateDish`, `createCategory`, `updateCategory` antes de tocar Storage/DB;
retornar `{ error }` humano si falla, manteniendo la forma de retorno actual.

Completed:
- `dishSchema` / `categorySchema` + helpers `*InputFromForm` y `firstZodMessage`.
- Las 4 actions validan antes de tocar Storage/DB y retornan `{ error }` humano
  (misma forma que espera `DishForm`).

Files:
- src/lib/validation/dish.ts (nuevo)
- src/app/admin/dishes/actions.ts
- src/app/admin/categories/actions.ts

Tests:
- tsc + lint + build limpios. CA-003 pendiente de smoke test.

SDD requirements satisfied:
- FR-002

## TASK-003 — Quitar modelo/foto desde el admin
Status: COMPLETED
Satisfies: FR-003

Descripción:
Checkboxes "Quitar modelo 3D"/"Quitar foto" en `DishForm` (solo en edición y si
existen). `updateDish` setea el campo a `null` + borra el objeto viejo, con la
precedencia: archivo nuevo gana sobre el checkbox de quitar.

Completed:
- Checkboxes `remove_photo`/`remove_model` en `DishForm` (solo edición y si el
  asset existe).
- `updateDish` los respeta con precedencia (archivo nuevo > quitar), pone el campo
  en `null` y borra el objeto viejo.

Files:
- src/app/admin/dishes/DishForm.tsx
- src/app/admin/dishes/actions.ts

Tests:
- tsc + lint + build limpios. CA-004 pendiente de smoke test.

SDD requirements satisfied:
- FR-003

## TASK-004 — Analytics determinístico con ?preview=1
Status: COMPLETED
Satisfies: FR-004

Descripción:
`TrackView` omite el registro si `location.search` tiene `preview=1` (manteniendo
el chequeo de referrer como red secundaria). Agregar `?preview=1` a los links del
admin que abren `/menu/[id]`.

Completed:
- `TrackView` corta si `preview=1` (señal determinística) + mantiene el referrer
  como red secundaria.
- Nuevo link "Ver" en `DishActions` que abre `/menu/[id]?preview=1` en pestaña
  nueva (preview del admin que no cuenta como visita). Los QR (`dishMenuUrl`)
  siguen sin el parámetro → escaneos reales cuentan.

Files:
- src/app/menu/[id]/TrackView.tsx
- src/app/admin/dishes/DishActions.tsx

Tests:
- tsc + lint + build limpios. CA-005 pendiente de smoke test.

SDD requirements satisfied:
- FR-004

## TASK-005 — ESLint ignora public/
Status: COMPLETED
Satisfies: FR-005

Descripción:
Agregar `"public/**"` a `globalIgnores` en `eslint.config.mjs` y verificar que
`npm run lint` termina sin errores ni warnings.

Completed:
- `"public/**"` agregado a `globalIgnores`. Al destapar el lint de `src/`
  aparecieron 4 errores pre-existentes (antes ocultos por el ruido de los
  bundles): se resolvieron también —
  `HeroSection` `<a>`→`<Link>`, `QrBlock` `setState`→`useMemo`,
  `optimize.ts` `module`→`mod`, y `DishViewer`/`InstallPWAButton`
  con eslint-disable puntual justificado (detección client-only legítima).
- `npm run lint` termina en 0.

Files:
- eslint.config.mjs
- src/app/HeroSection.tsx
- src/app/admin/dishes/QrBlock.tsx
- src/lib/glb/optimize.ts
- src/app/menu/[id]/DishViewer.tsx
- src/app/menu/[id]/InstallPWAButton.tsx

Tests:
- `npx eslint` exit 0, sin errores ni warnings (CA-006 ✓).

SDD requirements satisfied:
- FR-005

## TASK-006 — Iconos PWA PNG + glyph correcto + apple-touch-icon
Status: COMPLETED
Satisfies: FR-006

Descripción:
Corregir el SVG (glyph "3D" en vez de "S"), generar PNG 192/512/maskable con
`sharp` vía `scripts/gen-icons.mjs`, actualizar `manifest.webmanifest` a PNG y
agregar `apple-touch-icon` en el layout raíz.

Completed:
- SVG reescritos: cubo isométrico dorado (vector puro, sin dependencia de fuente
  — rasteriza confiable) en vez del glyph "S" del rebrand viejo.
- `scripts/gen-icons.mjs` genera con sharp: icon-192.png, icon-512.png,
  icon-maskable-512.png (verificados 192/512, image/png).
- `manifest.webmanifest` → PNGs (+ SVG "any" para escalabilidad).
- `layout.tsx` → `icon`/`apple` apuntan a PNG (apple-touch-icon para iOS).

Files:
- public/icons/icon-192.svg, icon-512.svg, icon-maskable-512.svg
- public/icons/icon-192.png, icon-512.png, icon-maskable-512.png (generados)
- scripts/gen-icons.mjs (nuevo)
- public/manifest.webmanifest
- src/app/layout.tsx

Tests:
- PNGs verificados con sharp (dimensiones/formato). Render visual OK (cubo dorado).
  CA-007 servido-en-prod pendiente de deploy.

SDD requirements satisfied:
- FR-006

## TASK-007 — Verificación integral (typecheck, lint, sin regresiones)
Status: COMPLETED
Satisfies: NFR-001, NFR-002, CA-008

Descripción:
`tsc --noEmit` y `npm run lint` limpios. Smoke test local del build y de los
flujos afectados (o verificación en el deploy si se deploya).

Completed:
- `npx tsc --noEmit` → 0 errores.
- `npx eslint` → 0 errores, 0 warnings.
- `npx next build` → exit 0, 13 rutas OK.
- Nota: warning de Next 16 de que `middleware.ts` está deprecado a favor de
  `proxy.ts` — pre-existente, fuera de alcance de M12 (candidato a task futura).

Files:
- (verificación, sin archivos nuevos)

Tests:
- tsc/lint/build verdes. Smoke test behavioral (CA-001..005 y CA-007 servido)
  pendiente de deploy a producción.

SDD requirements satisfied:
- NFR-001, NFR-002, CA-008
