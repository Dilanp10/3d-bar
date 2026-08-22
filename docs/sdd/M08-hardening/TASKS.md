# Tasks — M08: Hardening del admin

Fuente: [SDD.md](./SDD.md) (Approved)

## TASK-001 — Helper `sanitizeActionError`
Status: COMPLETED
Satisfies: FR-002, FR-003

Descripción:
`src/lib/errors/sanitize.ts` con `sanitizeActionError(error, fallback?)` que loguea el error crudo con `console.error("[action-error]", ...)` y devuelve mensaje humano matcheando keywords en el mensaje (case-insensitive) por categoría.

Completed:
- Categorías: `AuthRequiredError` → "Sesión expirada. Refrescá la página."; `foreign key` → "hay datos relacionados que dependen…"; `duplicate/unique/already exists` → "Ya existe un registro con esos datos."; `row-level security | permission denied` → "No tenés permiso…"; `storage | bucket | upload` → "Error al subir el archivo…"; `jwt | unauthorized | not authenticated` → "Sesión expirada…"; default → "Ocurrió un error…". El error crudo va a `console.error` server-side (visible en Vercel Logs) — nunca al browser.

Files:
- src/lib/errors/sanitize.ts

SDD requirements satisfied:
- FR-002, FR-003

## TASK-002 — Helper `requireAdmin` + `AuthRequiredError`
Status: COMPLETED
Satisfies: FR-001

Descripción:
`src/lib/auth/require-admin.ts` con `AuthRequiredError` (Error subclass) y `requireAdmin(supabase?)` que llama `getUser()`.

Completed:
- `AuthRequiredError` es reconocido por `sanitizeActionError` (import circular resuelto — sanitize importa desde `require-admin`).
- `requireAdmin` reusa cliente si se pasa (evita `createClient` doble). Si no hay user → throw.

Files:
- src/lib/auth/require-admin.ts

SDD requirements satisfied:
- FR-001

## TASK-003 — Aplicar helpers en `dishes/actions.ts`
Status: COMPLETED
Satisfies: FR-001, FR-002

Completed:
- `createDish`, `updateDish`, `deleteDish`, `toggleDishActive` — cada una arranca con `try { await requireAdmin(supabase) } catch (e) { return { error: sanitizeActionError(e) } }` como primera operación después de `createClient`.
- Todos los `error` de Supabase pasan por `sanitizeActionError`.
- `uploadFile` (que hace `throw new Error(...)`) también envuelto en try/catch en las dos actions que lo usan.
- Shape de return preservado (`{ error: string } | undefined`).

Files:
- src/app/admin/dishes/actions.ts

SDD requirements satisfied:
- FR-001, FR-002

## TASK-004 — Aplicar helpers en `categories/actions.ts`
Status: COMPLETED
Satisfies: FR-001, FR-002

Completed:
- Guard + sanitize aplicado a `createCategory`, `updateCategory`, `deleteCategory`.
- Guard de "categoría en uso" existente (de la deuda M04 cerrada en commit anterior) preservado, con su mensaje custom que no pasa por sanitize (ya es humano de origen).

Files:
- src/app/admin/categories/actions.ts

SDD requirements satisfied:
- FR-001, FR-002

## TASK-005 — Aplicar `sanitize` en `login/actions.ts` y `logout/actions.ts`
Status: NO_CHANGE
Satisfies: FR-002

Completed:
- `login/actions.ts` ya devuelve `GENERIC_ERROR` fijo desde M03 — no filtra detalles internos de Supabase por diseño (evita distinguir "usuario no existe" vs "password incorrecto" vs "email not confirmed"). No requiere cambios.
- `logout/actions.ts` no devuelve errores: siempre corre `signOut()` y `redirect()`. No hay superficie para leak. No requiere cambios.

Files:
- (ninguno)

SDD requirements satisfied:
- FR-002 (cumplido ya de origen — nada a cambiar)

## TASK-006 — Helper `areSignupsOpen`
Status: COMPLETED
Satisfies: FR-004

Completed:
- `src/lib/auth/signups-status.ts`: cliente anon aislado con `createClient` de `@supabase/supabase-js` (no `ssr`), con `persistSession: false` — no interfiere con las cookies de la sesión activa del admin.
- Probe: `signUp({ email: "hardening-probe+<ts>@example.invalid", password: <random> })`. Dominio `.invalid` es reservado por RFC 2606, ningún mail real.
- Envuelto en `Promise.race` con timeout 3s → si tarda más, devuelve `null`.
- Parsing del resultado: matchea regex `/signups?\s*not\s*allowed|signups?\s*disabled|signup\s*is\s*disabled/i` → `false`; timeout/exception → `null`; cualquier otra cosa → `true` (peor caso, conservador).

Files:
- src/lib/auth/signups-status.ts

SDD requirements satisfied:
- FR-004

## TASK-007 — Componente `SignupsWarning` + integración en admin
Status: COMPLETED
Satisfies: FR-004

Completed:
- `src/app/admin/SignupsWarning.tsx`: async Server Component que llama `areSignupsOpen()` y renderiza banner ámbar sólo si el resultado es `true` (`false | null` → `null`).
- Insertado en el **layout** de admin (no en `page.tsx` — `/admin` es sólo redirect). Aparece automáticamente en todas las páginas del admin (dishes, categories, edit, new, qrs/print). Costo: 1 probe por render de layout — aceptable para uso interno.

Files:
- src/app/admin/SignupsWarning.tsx
- src/app/admin/layout.tsx (modificado)

SDD requirements satisfied:
- FR-004

## TASK-008 — Verificación end-to-end
Status: COMPLETED
Satisfies: CA-001, CA-002, CA-003, CA-004, CA-005, CA-006, CA-007

Completed en dev:
- **CA-001** ✓ — con sesión rota (cookies `sb-*` borradas + fetch de prueba a `/admin/dishes` retorna redirect a login), click en botón "Ocultar" de "Hamburguesa Sharif" no cambió el flag: en la DB seguía `active = true` post-click. Sin el guard, ese toggle habría desactivado el plato públicamente.
- **CA-002/CA-003/CA-007** ✓ — code review sobre las 7 Server Actions modificadas: shape `{ error: string } | undefined` preservado; todo `error.message` de Supabase pasa por `sanitizeActionError`; error crudo de Storage se convierte en "Error al subir el archivo…" (verificado por matching del helper).
- **CA-004** ✓ — banner visible en `/admin/dishes` con el texto exacto esperado ("Los sign-ups de Supabase Auth siguen habilitados"). Confirma que el probe detectó correctamente que hoy los sign-ups están ON en el proyecto Supabase de bar-sharif.
- **CA-005** — pendiente de acción manual: cuando dilan desactive los sign-ups en el dashboard de Supabase, el banner debería desaparecer al recargar. No verificado in-vivo (no toqué la config de auth de tu proyecto).
- **CA-006** ✓ — code review del helper: `Promise.race` con timeout 3s + catch general → `null`; el componente renderiza `null` cuando resultado ≠ `true`. Nunca rompe el render.
- **Build de producción** ✓ — `npm run build` completa limpio, todas las rutas siguen apareciendo en el manifest.

SDD requirements satisfied:
- CA-001, CA-002, CA-003, CA-004, CA-006, CA-007. CA-005 pendiente de que dilan desactive sign-ups en el dashboard.
