# SDD — M05: Upload y optimización de `.glb`

## 1. Identificación
Module: M05
Name: Upload y optimización de modelos 3D (.glb)
Status: Approved
Approved: 2026-08-21

## 2. Objetivo

Permitir que el admin suba un `.glb` crudo de RealityScan (20–100 MB) desde el formulario de plato, comprimirlo automáticamente en el navegador (geometría con Draco + texturas resize/WebP) y almacenar la versión optimizada en Supabase Storage — sin pasar el archivo original por ninguna función serverless de Vercel, que rechaza payloads mayores a 4.5 MB.

## 3. Alcance

### Incluye
- Pipeline de optimización client-side (`src/lib/glb/optimize.ts`): compresión de geometría con Draco (`@gltf-transform`) + resize/re-encode de texturas a WebP.
- Integración en `DishForm.tsx`: al enviar el formulario, si hay un archivo `.glb` nuevo seleccionado, se optimiza antes de subir; se muestra estado de progreso ("Optimizando modelo 3D…") con el submit deshabilitado.
- Upload directo del `.glb` optimizado a Supabase Storage (bucket `models`) desde el browser, usando el cliente Supabase autenticado del admin — bypass total de los Server Actions para el binario.
- Ajuste de `createDish`/`updateDish` (M04) para recibir `model_url` (string, ya subido) en vez de un `File` crudo.
- Manejo de error: si la optimización falla (archivo corrupto, formato no soportado), se cancela el submit y se muestra un mensaje claro — nunca se sube el archivo sin comprimir como fallback silencioso.
- Comparación de tamaño antes/después mostrada al admin tras optimizar (ej. "42 MB → 6.1 MB").

### No incluye (queda fuera / es de otro módulo)
- Compresión de textura real a KTX2/Basis Universal — requiere el binario nativo `toktx`, no disponible en el runtime de Vercel ni en browser sin infra adicional. Queda documentado como mejora futura si el peso de las texturas WebP resulta insuficiente.
- Optimización server-side vía webhook — descartada en esta iteración (ver decisión de arquitectura más abajo).
- Generación automática de `thumbnail_url` — el bucket `thumbnails` existe (creado en M03) pero sigue sin uso; `DishViewer` ya tiene fallback a `photo_url` como poster.
- Cambios al flujo de upload de `photo` — sigue vía Server Action tal como quedó en M04 (los JPEG/WebP de una foto de plato rara vez superan el límite de Vercel; se documenta como riesgo residual conocido, no se resuelve en este módulo).
- Web Worker para no bloquear el hilo principal durante la optimización — se implementa en el hilo principal con UI deshabilitada; es una acción deliberada y poco frecuente (un admin cargando un plato nuevo), no justifica la complejidad de un Worker en el MVP.
- Progreso granular (% de bytes subidos) — el upload muestra spinner indeterminado, no barra de progreso.

### Decisión de arquitectura (contexto)
Vercel Functions —incluidos los Server Actions de Next— tienen un límite duro de 4.5 MB de payload de entrada, no configurable desde la app. Un `.glb` crudo de RealityScan (20–100 MB) nunca podría llegar completo a un Server Action. Se evaluaron dos opciones://
- **(A) Elegida** — Optimizar en el browser del admin antes de subir, y subir directo a Supabase Storage. Cero infra nueva, cero límite de payload (el browser sube directo al Storage, no pasa por Vercel).
- (B) Descartada — Subir el crudo directo a Storage y disparar un webhook que optimice server-side. Más robusto para admins múltiples/uploads concurrentes, pero agrega infra (webhook + función) que no se justifica para un único admin subiendo platos ocasionalmente.

## 4. Requisitos funcionales

- **FR-001** — Al seleccionar un archivo `.glb` en `DishForm`, y al enviar el formulario, se ejecuta la pipeline de optimización (Draco + texturas) sobre ese archivo antes de cualquier upload.
- **FR-002** — Mientras se optimiza y se sube, el formulario muestra un estado de carga ("Optimizando modelo 3D…" → "Subiendo…") y el botón submit queda deshabilitado.
- **FR-003** — El `.glb` optimizado se sube directamente a Supabase Storage (bucket `models`, path `dishes/<timestamp>.glb`) desde el cliente browser, usando la sesión autenticada del admin.
- **FR-004** — Si la optimización falla (archivo corrupto, no es un `.glb`/`.gltf` válido, o cualquier excepción de la pipeline), el submit se cancela, no se sube nada, y se muestra un mensaje de error específico ("No se pudo procesar el modelo 3D: verificá que el archivo sea un .glb válido").
- **FR-005** — Tras optimizar, se le muestra al admin el tamaño antes/después del archivo (para que note si RealityScan le dio un modelo razonable o si necesita re-escanear con menos detalle).
- **FR-006** — El `model_url` resultante (ya público, ya subido) reemplaza al campo `File` que hoy recibe `createDish`/`updateDish`; esas Server Actions dejan de subir el modelo — solo lo guardan en la fila de `dishes`.
- **FR-007** — Si el archivo optimizado sigue pesando más de 15 MB, se permite subir igual pero se muestra una advertencia no bloqueante ("El modelo sigue pesando bastante, puede tardar en cargar en 4G").

## 5. Requisitos no funcionales

- **NFR-001** — El archivo `.glb` crudo nunca se envía completo a una función Vercel — solo el binario ya optimizado (esperado ≤15 MB en la mayoría de los casos) viaja del browser a Supabase Storage directamente, evitando el límite de 4.5 MB de Vercel Functions.
- **NFR-002** — La pipeline de optimización (`@gltf-transform` + WASM de Draco) se importa dinámicamente (`import()`) solo cuando el admin selecciona un archivo, para no inflar el bundle inicial de `/admin/dishes/new` y `/admin/dishes/[id]/edit`.
- **NFR-003** — Reducción esperada de tamaño: al menos 70% respecto al `.glb` crudo en casos típicos de fotogrametría (geometría densa + 1–4 texturas grandes). La reducción real depende del contenido; no es una garantía dura.
- **NFR-004** — La pipeline corre en el hilo principal del browser (sin Web Worker) — UI bloqueada/deshabilitada durante el proceso, tiempo esperado de unos pocos segundos a ~1 minuto según el tamaño del archivo y la CPU del dispositivo del admin.
- **NFR-005** — Compatibilidad: la pipeline debe funcionar en los navegadores de escritorio y mobile modernos que el admin vaya a usar (Chrome/Edge/Safari recientes) — no se apunta a compatibilidad legacy.

## 6. Arquitectura del módulo

```
src/
  lib/
    glb/
      optimize.ts              # optimizeGlb(file: File): Promise<{ file: File, originalSize: number, optimizedSize: number }>
  app/
    admin/
      dishes/
        DishForm.tsx             # MODIFICADO: onSubmit custom (ya no <form action={serverAction}>)
        actions.ts                # MODIFICADO: createDish/updateDish reciben model_url string, no File
```

### Componentes y responsabilidades

| Archivo | Tipo | Responsabilidad |
|---|---|---|
| `lib/glb/optimize.ts` | Client util | Carga el `.glb` con `@gltf-transform/core`, aplica transform `draco()` (compresión de geometría, WASM sin binario nativo) y un paso de resize/re-encode de texturas a WebP. Devuelve un `File` optimizado + metadata de tamaño. Lanza excepción tipada si el archivo no es un glTF/glb válido. |
| `DishForm.tsx` | Client | Deja de usar `<form action={serverAction}>` directo; pasa a `onSubmit` custom: si hay `model` file nuevo → `optimizeGlb()` → upload a Storage con el browser client de Supabase → obtiene `model_url` → arma el payload final y llama a la Server Action (`createDish`/`updateDish`) como función async normal (no como form action). Maneja los 3 estados de UI: idle / optimizing / uploading / error. |
| `dishes/actions.ts` | Server Actions | `createDish`/`updateDish` dejan de manejar el archivo del modelo — reciben `model_url` (string \| null) ya resuelto. El upload de `photo` sigue igual que en M04 (sin cambios). |

## 7. Flujo de datos

### Alta/edición de plato con modelo 3D nuevo
```
Admin selecciona plato.glb (42 MB) en DishForm → click "Crear plato"
   → onSubmit (client, custom handler)
       → optimizeGlb(file)
           → gltf-transform: load → draco() → texturas → WebP resize
           → si falla: throw → mostrar error, abortar submit
           → devuelve File optimizado (ej. 6.1 MB) + tamaños
       → mostrar "42 MB → 6.1 MB. Subiendo..."
       → supabase.storage.from("models").upload(`dishes/${Date.now()}.glb`, optimizedFile)
       → getPublicUrl() → model_url
       → llamar createDish({ ...resto de campos del form, model_url }) [Server Action invocada como función, no como form action]
   → Server Action inserta la fila con model_url ya resuelto
   → revalidatePath(...) + redirect("/admin/dishes")
```

## 8. Modelo de datos

Este módulo no crea tablas ni columnas nuevas. Usa `dishes.model_url` (ya existente desde M02) y el bucket `models` (creado en M03, policy `Auth insert models` ya permite `INSERT` a `authenticated` — sin cambios de RLS/Storage necesarios).

## 9. API

Sin HTTP propio. Cambia la firma de las Server Actions existentes de M04:

- `createDish(formData)` — el campo `model` (File) deja de leerse; se agrega/usa `model_url` (string) ya presente en el FormData construido client-side.
- `updateDish(id, formData)` — ídem.

`optimizeGlb(file: File): Promise<{ file: File; originalSize: number; optimizedSize: number }>` — función pura del lado cliente, no es un endpoint.

## 10. Seguridad

- El upload directo a Storage desde el browser usa la sesión del admin (cookies HTTP-only ya validadas por M03) — el cliente browser de Supabase (`@supabase/ssr` `createBrowserClient`) reenvía la sesión automáticamente; la policy `Auth insert models` (rol `authenticated`) es la única barrera de autorización, igual que ya ocurre con la escritura en `dishes`/`categories`.
- No se valida server-side que el archivo subido a Storage sea realmente un `.glb` válido y optimizado — un admin malicioso (o con sesión comprometida) podría subir cualquier binario al bucket `models` sin pasar por la pipeline. Riesgo aceptado: es el único admin del sistema y el bucket ya limita tamaño (50 MB) y no es ejecutable.
- El `allowed_mime_types` del bucket `models` (`model/gltf-binary`, `application/octet-stream`) no discrimina realmente contenido — es una validación débil, ya existente desde M03, sin cambios en este módulo.

## 11. Dependencias

### Módulos internos
- **M03 (COMPLETED)** — bucket `models` y su policy de escritura `authenticated` ya existen.
- **M04 (COMPLETED)** — este módulo **modifica** `DishForm.tsx` y `dishes/actions.ts`. Es un cambio sobre código ya aprobado; se documenta acá como impacto explícito, no se reabre el SDD de M04 (el contrato funcional externo — FR-002/FR-003/FR-006 de M04 — no cambia, solo la implementación interna del campo `model`).

### Librerías externas (nuevas)
- `@gltf-transform/core`, `@gltf-transform/functions`, `@gltf-transform/extensions` — pipeline de optimización.
- Encoder Draco compatible con browser (WASM) — a definir en Tasks el paquete exacto (`draco3d` build web vs. alternativa).

## 12. Criterios de aceptación

- **CA-001** — Subir un `.glb` de prueba de ~40 MB desde `/admin/dishes/new` completa sin error `FUNCTION_PAYLOAD_TOO_LARGE` (el archivo optimizado, no el crudo, es lo único que llega a algún backend).
- **CA-002** — El archivo resultante en el bucket `models` pesa significativamente menos que el original (reducción visible, no necesariamente ≥70% en todos los casos).
- **CA-003** — El plato creado con el modelo optimizado se ve correctamente en `/menu/[id]` con `<model-viewer>` (geometría y texturas íntegras, sin artefactos visibles de la compresión).
- **CA-004** — Subir un archivo que no es un `.glb` válido (ej. un `.txt` renombrado) muestra el error específico de FR-004 y no crea/edita el plato.
- **CA-005** — Editar un plato existente sin tocar el campo modelo no dispara la pipeline de optimización (el `model_url` existente se preserva sin cambios).
- **CA-006** — El bundle JS de `/admin/dishes/new` no crece significativamente en el chunk inicial (verificable con el analizador de bundle de Next) — la pipeline de optimización debe estar en un chunk separado cargado solo al seleccionar archivo.
