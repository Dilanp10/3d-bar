# SDD — M04: Gestión de platos (CRUD sin optimización 3D)

## 1. Identificación
Module: M04
Name: Gestión de platos y categorías (CRUD)
Status: Approved
Approved: 2026-08-21 (SDD retroactivo — código ya en producción; gaps de seguridad documentados en sección 10 aceptados como deuda conocida, no bloqueante)

**Nota:** SDD retroactivo. El código ya existe y está en producción (implementado antes del SDD, violando la regla dura de la skill). Este documento describe lo que **realmente existe hoy**, no un diseño ideal.

## 2. Objetivo

Darle al admin (dueño del bar, autenticado vía M03) una interfaz para gestionar el contenido de la carta: crear, editar, activar/desactivar y borrar platos; crear, editar y borrar categorías. Incluye upload de foto y de modelo `.glb` crudo (sin optimizar — la optimización Draco/KTX2 es de M05).

## 3. Alcance

### Incluye
- Listado de platos (`/admin/dishes`) con nombre, categoría, precio, estado activo/inactivo, acciones.
- Alta de plato (`/admin/dishes/new`) con formulario: nombre, descripción, precio, orden, categoría, foto, modelo `.glb`, checkbox activo.
- Edición de plato (`/admin/dishes/[id]/edit`) — mismo formulario, precargado, incluye platos inactivos.
- Borrado de plato con confirmación (`window.confirm`).
- Toggle activo/inactivo sin confirmación (acción reversible y de bajo impacto).
- Upload de foto (bucket `photos`) y modelo `.glb` (bucket `models`) a Supabase Storage, path `dishes/<timestamp>.<ext>`.
- Listado de categorías (`/admin/categories`) con edición inline y alta rápida.
- Borrado de categoría con confirmación.
- Revalidación de rutas afectadas (`/admin/dishes`, `/menu/[id]`, `/`) tras cada mutación.

### No incluye (queda fuera / es de otro módulo)
- Optimización del `.glb` (Draco/KTX2) → M05.
- Generación de thumbnail automático → M05 (`thumbnail_url` queda `null` en M04).
- Generación de QR → M06.
- Reordenamiento drag-and-drop de `sort_order` (hoy es un input numérico manual).
- Bulk actions (borrar/activar varios a la vez).
- Historial de cambios / auditoría.
- Validación de tamaño máximo de archivo en el cliente (el bucket sí limita: photos 5MB, models 50MB, vía policy de Storage de M03).

## 4. Requisitos funcionales

- **FR-001** — El admin ve una tabla con todos los platos (activos e inactivos), ordenados por `sort_order`.
- **FR-002** — El admin puede crear un plato nuevo con nombre y precio obligatorios; el resto de los campos son opcionales.
- **FR-003** — El admin puede editar cualquier campo de un plato existente, incluyendo reemplazar foto y/o modelo.
- **FR-004** — El admin puede alternar el estado `active` de un plato con un solo click, sin confirmación.
- **FR-005** — El admin puede borrar un plato permanentemente, con confirmación previa (`confirm()`).
- **FR-006** — Al crear/editar un plato con archivo de foto o modelo, el archivo se sube a Storage y la URL pública se guarda en `photo_url`/`model_url`.
- **FR-007** — El admin ve una tabla de categorías con nombre y orden, puede editarlas inline (sin navegar a otra página) y borrarlas.
- **FR-008** — El admin puede crear una categoría nueva desde un formulario inline en la misma página de listado.
- **FR-009** — Tras cualquier mutación (crear/editar/borrar/toggle), las páginas públicas afectadas (`/`, `/menu/[id]`) y el propio admin se revalidan para reflejar el cambio sin reload manual.

## 5. Requisitos no funcionales

- **NFR-001** — Las Server Actions de este módulo no vuelven a verificar sesión explícitamente porque ya están protegidas por el middleware + layout de M03 (defensa ya cubierta en capa superior). *(Nota: esto es una decisión implícita del código actual, no estaba en ningún SDD — señalada acá para que el usuario la ratifique o la rechace.)*
- **NFR-002** — Los errores de Supabase (`error.message`) se muestran tal cual al usuario en el formulario. *(Gap detectado: esto puede filtrar detalles internos de Postgres/Storage — a diferencia de M03 que exige mensaje genérico. Señalado para decisión del usuario.)*
- **NFR-003** — El upload de archivos no tiene validación de tipo/tamaño en el cliente más allá del atributo HTML `accept`; la validación real de tamaño vive en las policies de Storage (M03: 5MB fotos, 50MB modelos) y ahí sí bloquea, pero sin mensaje amigable — el usuario ve el error crudo de Supabase.
- **NFR-004** — La tabla de precios usa `formatPrice` (ARS, sin decimales) consistente con M02.
- **NFR-005** — La UI sigue la paleta bar-lounge de M02/M03.

## 6. Arquitectura del módulo

```
src/app/admin/
  dishes/
    page.tsx              # Server Component — lista platos (join category)
    DishActions.tsx        # Client — botones toggle/editar/borrar por fila
    DishForm.tsx            # Client — formulario compartido crear/editar (useActionState)
    actions.ts               # Server Actions: createDish, updateDish, deleteDish, toggleDishActive
    new/
      page.tsx              # Server Component — wrapper de DishForm en modo alta
    [id]/edit/
      page.tsx              # Server Component — wrapper de DishForm en modo edición (activeOnly:false)
  categories/
    page.tsx                # Server Component — lista categorías
    CategoryRow.tsx           # Client — fila con modo edición inline (useState local)
    NewCategoryForm.tsx        # Client — formulario de alta rápida
    actions.ts                 # Server Actions: createCategory, updateCategory, deleteCategory
```

### Componentes y responsabilidades

| Archivo | Tipo | Responsabilidad |
|---|---|---|
| `dishes/actions.ts` | Server Actions | `uploadFile()` helper interno (sube a bucket, devuelve public URL). `createDish`/`updateDish` arman el objeto y hacen insert/update; `deleteDish`/`toggleDishActive` mutaciones simples. Todas revalidan paths relevantes. |
| `dishes/DishForm.tsx` | Client | Un solo componente para alta y edición (recibe `dish?` opcional). `useActionState` para mostrar error y estado pending. Inputs: nombre, descripción, precio, orden, categoría (select), foto (file), modelo (file), activo (checkbox). |
| `dishes/page.tsx` | Server | Trae `dishes` con `category:categories(name)`, ordenado por `sort_order`. Tabla responsive (categoría oculta en mobile). |
| `dishes/[id]/edit/page.tsx` | Server | Usa `getDishById(id, { activeOnly: false })` (extensión de M02 para incluir inactivos) + bind de `updateDish` con el `id` vía closure server action. |
| `categories/actions.ts` | Server Actions | CRUD simple de `categories`, revalida `/admin/categories` y `/admin/dishes` (porque el select de categoría en DishForm depende de esta lista). |
| `categories/CategoryRow.tsx` | Client | Toggle local `editing` con `useState`; en modo edición reemplaza la fila por un mini-form inline. |

## 7. Flujo de datos

### Alta de plato con archivos
```
Admin → /admin/dishes/new → completa form + selecciona foto/modelo → submit
   → Server Action createDish(formData)
       → si hay foto: uploadFile(supabase, "photos", file, "dishes") → photo_url
       → si hay modelo: uploadFile(supabase, "models", file, "dishes") → model_url
       → supabase.from("dishes").insert({...})
       → revalidatePath("/admin/dishes"), revalidatePath("/")
       → redirect("/admin/dishes")
```

### Edición de categoría inline
```
Admin click "Editar" en fila → CategoryRow entra en modo `editing` (client state)
   → completa form inline → submit
       → Server Action updateCategory(id, formData)
       → revalidatePath("/admin/categories"), revalidatePath("/admin/dishes")
   → CategoryRow vuelve a modo lectura (setEditing(false))
```

### Toggle activo
```
Admin click "Ocultar"/"Mostrar" en DishActions
   → Server Action toggleDishActive(id, !active)
       → update({ active }) en dishes
       → revalidatePath("/admin/dishes"), revalidatePath(`/menu/${id}`), revalidatePath("/")
```

## 8. Modelo de datos

Este módulo no crea tablas nuevas — usa `dishes` y `categories` ya definidas en M02, con las policies de escritura `dishes_admin_write` / `categories_admin_write` de M03. No agrega columnas.

**Storage (buckets ya creados fuera de scope formal, en migración `m03_storage_buckets` durante la sesión de M03):**
- `photos` — público, 5MB máx, `image/jpeg|png|webp`.
- `models` — público, 50MB máx, `model/gltf-binary|application/octet-stream`.
- `thumbnails` — público, 2MB máx — **sin uso todavía** (M04 no genera thumbnails; queda para M05).

Path de upload: `dishes/<Date.now()>.<ext>` — sin sanitización del nombre original más allá de tomar la extensión.

## 9. API

Sin HTTP propio — todo vía Server Actions (Next):

- `createDish(formData) → { error: string } | never` (redirige en éxito)
- `updateDish(id, formData) → { error: string } | never` (redirige en éxito)
- `deleteDish(id) → { error: string } | undefined`
- `toggleDishActive(id, active) → { error: string } | undefined`
- `createCategory(formData) → { error: string } | undefined`
- `updateCategory(id, formData) → { error: string } | undefined`
- `deleteCategory(id) → { error: string } | undefined`

## 10. Seguridad

- **RLS como única barrera de autorización a nivel dato:** las Server Actions no re-verifican `getUser()` — confían en que solo se llega a estas rutas autenticado (middleware + layout de M03) y en que RLS (`*_admin_write`, rol `authenticated`) bloquearía un insert/update/delete si por algún motivo la sesión no fuera válida. **Gap:** si alguna vez se expone una de estas Server Actions fuera del árbol `/admin` (poco probable pero posible por refactor futuro), quedaría sin protección explícita.
- **Mensajes de error sin sanitizar:** a diferencia del login (M03, mensaje genérico obligatorio), acá se muestra `error.message` de Supabase tal cual. Puede filtrar nombres de columnas/constraints. Riesgo bajo (solo lo ve el admin autenticado) pero inconsistente con el estándar de M03.
- **Sin rate limiting propio** en creación/borrado — mismo criterio que M03 (se apoya en límites nativos de Supabase, que acá aplican más débil porque no es un endpoint de auth).
- **Borrado sin soft-delete:** `deleteDish`/`deleteCategory` son DELETE reales — no hay papelera ni recuperación. Un plato borrado con `category_id` referenciado no rompe nada (FK permite null), pero no hay confirmación de qué categorías se usan antes de borrarlas (`deleteCategory` no chequea si hay platos usándola — el FK con `ON DELETE` no explícito puede fallar o dejar platos huérfanos, a confirmar comportamiento real).
- **Upload sin sanitización de nombre de archivo:** solo se usa la extensión (`file.name.split(".").pop()`), el resto del nombre no se usa — no hay riesgo de path traversal, pero tampoco hay validación de que la extensión declarada coincida con el contenido real del archivo (un `.jpg` malicioso podría subirse como si fuera válido; el bucket sí valida `allowed_mime_types` a nivel Storage, que mitiga esto parcialmente).

## 11. Dependencias

### Módulos internos
- **M02 (COMPLETED)** — usa `getDishById` (extendido con el parámetro `activeOnly`) y `Dish` type.
- **M03 (COMPLETED)** — requiere sesión autenticada (middleware + layout) y las policies `*_admin_write`. Requiere también los buckets Storage creados en `m03_storage_buckets`.

### Infraestructura externa
- Buckets `photos` y `models` ya existen y tienen policies (creados en la migración `m03_storage_buckets`).

### Librerías externas
- Ninguna nueva — usa `@supabase/ssr` ya instalado.

## 12. Criterios de aceptación

- **CA-001** — `/admin/dishes` muestra los 4 platos seed con nombre, categoría, precio formateado y estado activo.
- **CA-002** — Crear un plato nuevo con nombre+precio (sin archivos) lo agrega a la tabla y aparece en `/` si está activo y tiene categoría con platos visibles.
- **CA-003** — Editar un plato existente y guardarlo refleja los cambios inmediatamente en `/admin/dishes` y en `/menu/[id]`.
- **CA-004** — Subir una foto en el form de alta la sube al bucket `photos` y el plato queda con `photo_url` público válido (accesible sin auth).
- **CA-005** — Toggle "Ocultar" en un plato activo lo saca de `/` (la landing pública) sin recargar la página del admin.
- **CA-006** — Borrar un plato con confirmación lo elimina de la tabla y de Supabase; visitar su URL vieja en `/menu/[id]` devuelve 404.
- **CA-007** — Crear una categoría nueva la agrega al listado y aparece como opción en el `<select>` del form de platos.
- **CA-008** — Editar una categoría inline (sin navegar) actualiza su nombre/orden en la tabla y no rompe la referencia de los platos que la usan.
- **CA-009** — Un usuario sin sesión (anon) que intenta llamar estas Server Actions directamente (ej. vía fetch manual) es rechazado por RLS a nivel base de datos, aunque no haya check explícito en el código de la action.
