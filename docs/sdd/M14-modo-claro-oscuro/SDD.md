# SDD — M14: Modo claro / oscuro

## 1. Identificación
Module: M14
Name: Modo claro / oscuro
Status: Approved   <!-- Draft | Approved -->

## 2. Objetivo
Permitir alternar entre tema **oscuro** (actual) y **claro** en toda la app
(público + admin), con un botón. La preferencia se recuerda entre visitas y por
defecto sigue la configuración del sistema del usuario. Sin parpadeo de tema
incorrecto al cargar (no FOUC).

## 3. Alcance
Incluye:
- Paleta **clara** completa (tokens CSS) además de la oscura existente.
- Botón de alternancia (sol/luna) accesible desde cualquier página.
- Persistencia de la elección (`localStorage`) y default = preferencia del SO.
- Script inline anti-parpadeo que aplica el tema antes del primer render.
- Aplica a **toda la app** (usa los mismos tokens que ya consumen los componentes).

No incluye:
- Elegir un color de acento personalizado (era otra opción; no es esto).
- Temas múltiples / paletas de marca.
- Cambiar el diseño de ninguna pantalla (solo colores vía tokens).

## 4. Requisitos funcionales
- FR-001 — Existe un tema **claro** y uno **oscuro**, definidos como variables CSS
  sobre `:root` (`--background`, `--foreground`, `--accent`, etc.).
- FR-002 — Un botón (ícono sol/luna) alterna el tema. Visible en público y admin.
- FR-003 — La elección se guarda en `localStorage` (`theme` = `"light"|"dark"`) y
  se mantiene al recargar o volver.
- FR-004 — Si el usuario nunca eligió, se usa la preferencia del sistema
  (`prefers-color-scheme`).
- FR-005 — No hay parpadeo: al cargar, el tema correcto se aplica antes de pintar
  el contenido (script inline en el `<head>`/inicio del `<body>`).

## 5. Requisitos no funcionales
- NFR-001 — Contraste accesible en ambos temas (texto legible, foco visible).
- NFR-002 — Sin dependencias nuevas (no `next-themes`; implementación propia
  mínima con `data-theme` en `<html>`).
- NFR-003 — `tsc`/`eslint`/`next build` limpios; sin regresiones.

## 6. Arquitectura del módulo
- `src/app/globals.css` — define tokens del tema oscuro (base `:root`) y del claro
  (`:root[data-theme="light"]` + `@media (prefers-color-scheme: light)` para el
  caso "sin elección"). Agrega `color-scheme` por tema.
- `src/components/ThemeToggle.tsx` — **nuevo**: botón client que lee/escribe
  `data-theme` en `document.documentElement` y `localStorage`.
- `src/components/ThemeScript.tsx` (o inline en `layout.tsx`) — **nuevo**: script
  que corre antes del paint y setea `data-theme` desde `localStorage`.
- `src/app/layout.tsx` — inyecta el script anti-FOUC y renderiza `<ThemeToggle/>`
  (fixed, esquina, en todas las páginas).

Mecanismo: `<html data-theme="light|dark">`. Los componentes ya usan los tokens
(`bg-background`, `text-foreground`, `text-accent`, …), así que el cambio se
propaga solo — no hay que tocar cada pantalla.

## 7. Flujo de datos
Carga → script inline lee `localStorage.theme` → si existe, setea
`html[data-theme]`; si no, el CSS cae a `prefers-color-scheme`. Click en el botón
→ setea `data-theme` + guarda en `localStorage`.

## 8. Modelo de datos
Sin cambios (no toca DB). Estado de UI en `localStorage` del navegador.

## 9. API
No aplica.

## 10. Seguridad
Sin impacto. `localStorage` solo guarda `"light"`/`"dark"`.

## 11. Dependencias
- Ninguna nueva. Reutiliza los tokens de `globals.css` que ya consumen todos los
  módulos de UI (M02, M10, M11, M13, etc.).

## 12. Criterios de aceptación
- CA-001 — El botón alterna visualmente entre claro y oscuro en público y admin.
- CA-002 — La elección persiste tras recargar y navegar.
- CA-003 — Sin elección previa, respeta el tema del sistema.
- CA-004 — No se ve parpadeo de tema incorrecto al cargar.
- CA-005 — Texto y controles legibles en ambos temas (contraste ok).
- CA-006 — `tsc`/`eslint`/`next build` limpios; verificado en prod tras deploy.
