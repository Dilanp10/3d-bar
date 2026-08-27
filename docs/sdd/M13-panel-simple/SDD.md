# SDD — M13: Panel de admin más simple (UX para no-técnicos)

## 1. Identificación
Module: M13
Name: Panel de admin más simple
Status: Approved   <!-- Draft | Approved -->

## 2. Objetivo
Hacer el panel `/admin` fácil de usar para el **dueño del bar**, que puede tener
poca familiaridad con tecnología. Reducir jerga, agrandar los controles, dar
guía visual y feedback claro. No cambia la funcionalidad ni el modelo de datos:
es una capa de usabilidad sobre el CRUD existente (M04/M05).

## 3. Alcance
Incluye:
- Rediseño de la **lista de platos** (`/admin/dishes`): de tabla densa con links
  de texto → **tarjetas con foto**, nombre grande, precio, estado en palabras, y
  **botones grandes con ícono + texto**.
- **Estado vacío guiado** ("Todavía no cargaste platos → tocá + Nuevo plato").
- **Formulario de plato** (`DishForm`): textos de ayuda claros por campo, sobre
  todo el modelo 3D ("Subí el .glb de RealityScan, se optimiza solo"), y
  agrupación visual (Datos / Foto / Modelo 3D).
- **Confirmación de borrado** en lenguaje claro ("Se va a borrar «X». No se puede
  deshacer.").
- **Nav** del admin con etiquetas + íconos simples.
- Retoque leve de `/admin/categories` para consistencia visual (botones/vacío).

No incluye (queda fuera):
- Cambios en la página pública / carta (son otro público — se decidió admin).
- Cambios de lógica de negocio, DB, auth, analytics.
- Onboarding/tour interactivo, i18n, multi-idioma.

## 4. Requisitos funcionales
- FR-001 — La lista de platos se muestra como **tarjetas** (grid responsive):
  foto (o placeholder), nombre, precio, categoría, y un badge de estado
  **"Activo" / "Oculto"** (texto + color, no solo un punto).
- FR-002 — Cada tarjeta tiene acciones como **botones táctiles con ícono + texto**:
  **Editar**, **Ver QR**, **Mostrar/Ocultar**, **Borrar**. Área de toque ≥ 40px.
- FR-003 — Estado vacío con mensaje guía + botón primario "+ Nuevo plato".
- FR-004 — El `DishForm` muestra ayuda por campo. El bloque de **Modelo 3D**
  explica en una línea qué subir y que se optimiza solo; mantiene el feedback de
  estado actual (Optimizando/Subiendo/Guardando) que ya existe.
- FR-005 — El borrado pide confirmación con el **nombre del plato** y aviso de
  irreversible (reemplaza el `confirm("¿Eliminar este plato?")` genérico).
- FR-006 — La barra de navegación usa etiquetas claras con íconos: Platos,
  Categorías, Visitas (etiqueta elegida en implementación en vez de "Analytics",
  más clara para un no-técnico). El cierre de sesión es un botón aparte
  (`LogoutButton`) alineado a la derecha de la misma barra, no un ítem del nav.

## 5. Requisitos no funcionales
- NFR-001 — Sin regresiones funcionales: crear/editar/borrar/ocultar/QR siguen
  funcionando igual (mismas Server Actions de M04/M05/M12).
- NFR-002 — Accesible: contraste suficiente, foco visible (ya hay `:focus-visible`
  global), targets grandes, textos legibles (≥ 14px en controles).
- NFR-003 — Responsive: usable en celular (el dueño probablemente cargue desde el
  teléfono) y desktop.
- NFR-004 — `tsc`, `eslint` y `next build` limpios.

## 6. Arquitectura del módulo
- `src/app/admin/dishes/page.tsx` — pasa a render de tarjetas (trae `photo_url`,
  `thumbnail_url`, `category`).
- `src/app/admin/dishes/DishCard.tsx` — **nuevo**: tarjeta de plato (client, usa
  las acciones existentes).
- `src/app/admin/dishes/DishActions.tsx` — botones más grandes con ícono+texto;
  confirmación de borrado mejorada (puede moverse a un diálogo simple).
- `src/app/admin/dishes/DishForm.tsx` — helper text + agrupación (sin cambiar la
  lógica de submit/optimización).
- `src/app/admin/layout.tsx` — nav con íconos.
- `src/app/admin/categories/page.tsx` — retoque leve (estado vacío/botones).
- Se reutiliza la paleta de `globals.css` (accent, background-*). Íconos: SVG
  inline (sin dependencias nuevas).

## 7. Flujo de datos
Sin cambios: las tarjetas y el form siguen llamando a `createDish`, `updateDish`,
`deleteDish`, `toggleDishActive` (M04/M05/M12). Solo cambia la presentación.

## 8. Modelo de datos
Sin cambios. La query de la lista agrega `photo_url`/`thumbnail_url` al select
para mostrar la miniatura.

## 9. API
No aplica (sin endpoints nuevos).

## 10. Seguridad
Sin cambios: el acceso sigue protegido por el middleware + allowlist
`ADMIN_EMAIL` (M03) y las actions por `requireAdmin` (M08/M12).

## 11. Dependencias
- M04 (CRUD) y M05 (upload) — reutiliza sus Server Actions.
- M12 (quitar modelo/foto, cleanup) — los checkboxes y el flujo se mantienen.
- M03/M08 (auth) — sin cambios.

## 12. Criterios de aceptación
- CA-001 — La lista de platos muestra tarjetas con foto, nombre, precio y badge
  de estado en palabras.
- CA-002 — Las acciones son botones con ícono + texto, tocables en celular.
- CA-003 — Con 0 platos aparece el estado vacío guiado con el botón primario.
- CA-004 — El form muestra ayuda clara en el bloque de Modelo 3D y mantiene el
  feedback de progreso.
- CA-005 — Borrar pide confirmación con el nombre del plato.
- CA-006 — `tsc`/`eslint`/`next build` limpios; crear/editar/borrar/ocultar/QR
  siguen funcionando (verificado en prod tras deploy).
