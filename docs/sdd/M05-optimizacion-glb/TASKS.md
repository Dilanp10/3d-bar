# Tasks — M05: Upload y optimización de `.glb`

Fuente: [SDD.md](./SDD.md) (Approved)

## TASK-001 — Spike: elegir y probar el encoder Draco WASM para browser
Status: COMPLETED
Satisfies: NFR-002, NFR-005

Descripción:
Instalar `@gltf-transform/core`, `@gltf-transform/functions`, `@gltf-transform/extensions` y el encoder Draco compatible con browser. Probar en un script/página mínima que se puede cargar dinámicamente en un Client Component y comprimir un `.glb` de prueba sin errores de bundling (Next/Turbopack + WASM).

Completed:
- Paquetes instalados: `@gltf-transform/core`, `@gltf-transform/functions`, `@gltf-transform/extensions`.
- **Hallazgo clave:** ni `draco3d` ni `draco3dgltf` (paquetes npm) traen un build de browser — solo exponen los archivos `_nodejs.js`, que además contienen un `require("fs")`/`require("path")` estático (dentro de una rama que en el browser nunca corre) que Turbopack igual intenta resolver al bundlear y falla con `Module not found: Can't resolve 'fs'`. Ambos paquetes se desinstalaron.
- Solución: se copiaron los `.wasm` y los glue `.js` (`draco_encoder_nodejs.js`/`draco_decoder_nodejs.js`, renombrados) como assets estáticos a `public/draco/`. `optimizeGlb()` los `fetch()`ea como texto plano y los evalúa con un shim mínimo de CommonJS (`new Function("module", "exports", code)`) — así el código nunca entra al grafo de módulos del bundler y el `require("fs")` jamás se analiza estáticamente.
- **Segundo bug encontrado y corregido:** gltf-transform necesita el encoder registrado (`registerDependencies`) en la misma instancia de `WebIO` que hace `writeBinary()` — la compresión Draco ocurre ahí, no en `readBinary()`. La primera versión registraba las dependencias en una instancia distinta a la usada para escribir, y fallaba con `Please install extension dependency, "draco3d.encoder"`. Se corrigió reusando una única instancia de `WebIO` para leer y escribir.
- Verificado end-to-end en el browser (página de spike temporal, ya eliminada): generar un `.glb` mínimo en memoria → `optimizeGlb()` → resultado válido, sin errores de bundling ni de runtime.

Files:
- public/draco/draco_encoder.wasm
- public/draco/draco_decoder.wasm
- public/draco/draco_encoder.js
- public/draco/draco_decoder.js
- src/lib/glb/optimize.ts

SDD requirements satisfied:
- NFR-002, NFR-005

## TASK-002 — `optimizeGlb()`: compresión de geometría con Draco
Status: COMPLETED
Satisfies: FR-001, NFR-003

Descripción:
Crear `src/lib/glb/optimize.ts` con `optimizeGlb(file: File): Promise<OptimizeResult>`. Aplica transform `draco()` de `@gltf-transform/functions`.

Completed:
- `optimizeGlb()` lee File como ArrayBuffer, carga Draco WASM vía `loadCjsModuleFromPublic`, registra extensión KHRDracoMeshCompression y las dependencias del encoder/decoder en **una sola instancia de WebIO reusada para leer y escribir** (ver nota en TASK-001), aplica `draco()`, serializa de vuelta a File.
- Error tipado `GlbOptimizeError` con mensajes descriptivos si el archivo no es .glb válido o falla Draco.
- Verificado con un `.glb` sintético: round-trip completo sin errores (480b → 712b; el overhead es esperado en mallas triviales de 3 vértices, Draco gana en mallas reales densas).

Files:
- src/lib/glb/optimize.ts

SDD requirements satisfied:
- FR-001, NFR-003

## TASK-003 — Agregar compresión de texturas (resize + WebP) a `optimizeGlb()`
Status: COMPLETED
Satisfies: FR-001, NFR-003

Descripción:
Extender la pipeline: recorrer texturas del documento glTF, re-codificarlas a WebP con resize (max 2048px) usando OffscreenCanvas.

Completed:
- `compressTexture()` lee la imagen como Blob, crea ImageBitmap, escala si excede 2048px, renderiza en OffscreenCanvas, convierte a WebP (quality 0.75).
- `compressAllTextures()` itera sobre todas las texturas del documento.
- Pipeline completa: texturas WebP → Draco geometría → serialización.
- Error tipado separado para fallas de textura.

Files:
- src/lib/glb/optimize.ts

SDD requirements satisfied:
- FR-001, NFR-003

## TASK-004 — Manejo de errores de la pipeline
Status: COMPLETED
Satisfies: FR-004

Descripción:
`optimizeGlb()` debe lanzar error tipado si el archivo no es válido o falla cualquier paso.

Completed:
- `GlbOptimizeError` extiende `Error` con `cause` para debugging.
- Tres bloques try/catch separados: parseo, texturas, Draco — cada uno con mensaje descriptivo en español.
- No hay fallback silencioso: cualquier error aborta y lanza.

Files:
- src/lib/glb/optimize.ts

SDD requirements satisfied:
- FR-004

## TASK-005 — Rediseñar `DishForm.tsx`: submit custom con estados optimizing/uploading/error
Status: COMPLETED
Satisfies: FR-002, FR-005, FR-007

Descripción:
Reemplazar `<form action={serverAction}>` por `onSubmit` custom con optimización → upload → save.

Completed:
- Form usa `onSubmit` custom con `e.preventDefault()`.
- Estados: idle → optimizing → uploading → saving → redirect (o error).
- `sizeInfo` state muestra "42 MB → 6.1 MB" verde tras optimizar (persiste durante upload/save).
- `sizeWarning` ámbar si > 15 MB post-optimización (FR-007).
- `optimizeGlb` importado dinámicamente (`import()`) solo al submit con modelo (NFR-002).
- Botón submit deshabilitado durante todo el proceso.
- Error de optimización muestra el mensaje de `GlbOptimizeError`.

Files:
- src/app/admin/dishes/DishForm.tsx

SDD requirements satisfied:
- FR-002, FR-005, FR-007

## TASK-006 — Upload directo a Supabase Storage desde el browser
Status: COMPLETED
Satisfies: FR-003, NFR-001

Descripción:
Desde `DishForm.tsx`, usar cliente browser de Supabase para subir el .glb optimizado a `models/dishes/<timestamp>.glb`.

Completed:
- Upload integrado en `DishForm.handleSubmit`: `supabase.storage.from("models").upload(path, result.file)` con el browser client.
- `getPublicUrl()` obtiene la URL pública, se pasa como `model_url` al FormData.
- El binario del modelo nunca toca un Server Action — bypass total de Vercel Functions.

Files:
- src/app/admin/dishes/DishForm.tsx

SDD requirements satisfied:
- FR-003, NFR-001

## TASK-007 — Actualizar `createDish`/`updateDish` para recibir `model_url` en vez de `File`
Status: COMPLETED
Satisfies: FR-006

Descripción:
Quitar lectura del campo `model` como File y el upload server-side. Leer `model_url` (string) del FormData.

Completed:
- `createDish`: lee `model_url` de formData en vez de `model` File. No llama `uploadFile` para models.
- `updateDish`: lee `model_url` de formData, solo setea `updates.model_url` si viene valor. Si el admin no toca el modelo, no se pisa.
- `uploadFile` sigue existiendo para `photo` (sin cambios).

Files:
- src/app/admin/dishes/actions.ts

SDD requirements satisfied:
- FR-006

## TASK-008 — Verificar code-splitting: pipeline solo carga al seleccionar archivo
Status: COMPLETED
Satisfies: NFR-002, CA-006

Descripción:
Confirmar que `@gltf-transform/*` y el encoder Draco no forman parte del bundle inicial de `/admin/dishes/new` — deben cargar recién cuando el admin selecciona un archivo `.glb` (`import()` dinámico dentro del handler de `onSubmit`).

Completed:
- `npm run build` (producción, sin Turbopack dev-mode prefetch). Nota: en `next dev` el chunk de `optimize.ts` sí aparece en `performance.getEntriesByType('resource')` incluso sin interactuar con el form — es prefetch agresivo del dev server, no indicativo del comportamiento real; por eso la verificación se hizo contra el build de producción, como pide la propia task.
- Se localizaron los 2 chunks que contienen `gltf-transform`/`KHR_draco`/`DracoEncoderModule` (`23jsa9hwjch5d.js`, 113KB, y `28r2hbkjpu4vb.js`, ~1MB) buscando ese texto en `.next/static/chunks/*.js`.
- Se comparó contra `.next/server/app/admin/dishes/new/page/build-manifest.json` (`rootMainFiles` + `polyfillFiles`, que son los JS que carga la ruta al entrar): ninguno de los dos chunks de gltf-transform aparece ahí. Confirmado: el ~1.1MB de la pipeline de optimización no viaja en el load inicial de `/admin/dishes/new`, solo se pide cuando el `import()` dinámico se ejecuta dentro de `handleSubmit`.

SDD requirements satisfied:
- NFR-002, CA-006

## TASK-009 — Verificación end-to-end con un `.glb` real
Status: COMPLETED
Satisfies: CA-001, CA-002, CA-003, CA-004, CA-005

Descripción:
Probar con un `.glb` de prueba pesado: (a) alta de plato completa sin `FUNCTION_PAYLOAD_TOO_LARGE`, (b) archivo en Storage pesa menos, (c) se ve en `/menu/[id]`, (d) archivo inválido muestra error, (e) editar sin tocar modelo preserva `model_url`.

Completed:
- No se pudo conseguir un `.glb` real de RealityScan (sin acceso a internet en esta sesión), así que se generó uno sintético pero realista: esfera subdividida (~40k triángulos) + textura procedural 2048×2048, directo en el browser vía una página de spike temporal (`src/app/admin/dev-e2e-test/page.tsx`, ya eliminada).
- **CA-004** ✓ — archivo inválido (.txt renombrado a .glb) → `optimizeGlb()` lanza `GlbOptimizeError`, no sube nada.
- **CA-001/CA-002** ✓ — pipeline completa ejecutada llamando las mismas funciones que usa `DishForm` (optimizeGlb → upload a Storage → `createDish`): el modelo optimizado quedó en `models/dishes/e2e-test-*.glb`, confirmado accesible públicamente vía `curl -I` (200, `Content-Type: model/gltf-binary`, 2.67MB). El plato "E2E Test Dish (M05)" apareció correctamente en `/admin/dishes`.
- **CA-005** ✓ — se editó el plato de prueba vía la UI real (solo cambiando el nombre) y se confirmó por SQL que `model_url` no se tocó.
- **CA-003 ✓ (tras investigar a fondo un falso positivo):** en un primer momento el `<model-viewer>` parecía no montar nunca, en ningún plato. Se investigó extensamente (Turbopack, chunk loading, hidratación) hasta encontrar la causa real: en todo browser automatizado usado para probar, la pestaña queda con `document.hidden = true`, lo que suspende `requestAnimationFrame` — y con él, tanto el swap de contenido de Suspense/streaming de React como la hidratación y los `useEffect` posteriores (incluida la carga de `<model-viewer>`). Confirmado disparando `window.$RV(window.$RB)` manualmente: arregla todo al instante. No es un bug de `DishViewer.tsx` ni de M02 — el código original (`import("@google/model-viewer")`) es correcto y no se tocó. Detalle completo en `PROJECT.md` → Deuda pendiente.
- Limpieza: plato de prueba borrado de la DB. El archivo `.glb` de prueba quedó huérfano en Storage (`models/dishes/e2e-test-1787348716895.glb`, 2.67MB) — no se pudo borrar por API en esta sesión (limitación de la herramienta de test), pendiente de borrado manual si se quiere (bajo impacto, bucket de dev).

Files:
- (verificación — no toca código de producción; página de spike creada y eliminada)

SDD requirements satisfied:
- CA-001, CA-002, CA-003, CA-004, CA-005 ✓
