# Tasks — M14: Modo claro / oscuro

Fuente: SDD.md (Approved)

## TASK-001 — Paleta clara en globals.css
Status: COMPLETED
Satisfies: FR-001, FR-004, NFR-001

Descripción:
Definir tokens del tema claro (`:root[data-theme="light"]` + `@media
(prefers-color-scheme: light)` para el caso sin elección) y `color-scheme` por
tema. El oscuro sigue siendo la base `:root`.

## TASK-002 — Script anti-FOUC
Status: COMPLETED
Satisfies: FR-005

Descripción:
Script inline que corre antes del paint y setea `html[data-theme]` desde
`localStorage.theme`. Inyectado desde el layout raíz.

## TASK-003 — Botón ThemeToggle
Status: COMPLETED
Satisfies: FR-002, FR-003

Descripción:
Componente client sol/luna que alterna `data-theme` en `<html>` + persiste en
`localStorage`. Fixed en esquina, presente en toda la app vía layout raíz.

## TASK-004 — Verificación
Status: COMPLETED
Satisfies: CA-001..006

Descripción:
`tsc`/`eslint`/`next build` limpios. Deploy + verificación visual en público
(claro/oscuro, persistencia, sin parpadeo).
