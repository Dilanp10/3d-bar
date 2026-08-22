# SDD — M08: Hardening del admin (deuda post-MVP)

## 1. Identificación
Module: M08
Name: Hardening del admin (deuda post-MVP)
Status: Approved

## 2. Objetivo
Cerrar la deuda técnica de seguridad documentada al terminar el MVP: (a) que las Server Actions del admin no filtren detalles internos de Postgres/Storage al mostrar errores, (b) que las Server Actions no dependan exclusivamente del middleware para validar sesión (defense-in-depth), (c) alertar visualmente al admin si los sign-ups en Supabase Auth siguen habilitados (M03 TASK-008 quedó como acción manual — este módulo agrega un check runtime que la hace visible en la UI).

## 3. Alcance

Incluye:
- Helper `src/lib/errors/sanitize.ts` con `sanitizeActionError(error, fallback)` que loguea el error real server-side y devuelve un mensaje genérico al cliente por categoría de error (permission denied, foreign key, unique violation, storage rejected, etc.).
- Helper `src/lib/auth/require-admin.ts` con `requireAdmin()` que hace `supabase.auth.getUser()` y arroja si no hay usuario — llamado al inicio de cada Server Action mutante.
- Aplicar los dos helpers en todas las Server Actions del admin: `src/app/admin/dishes/actions.ts`, `src/app/admin/categories/actions.ts`, `src/app/admin/dishes/[id]/edit/*` (bound), `src/app/admin/login/actions.ts` (sólo el sanitize; login por definición no requiere sesión previa).
- Banner de warning en `/admin` (y opcionalmente en el layout admin) si el proyecto detecta que sign-ups siguen habilitados. Detección: intento de `supabase.auth.signUp` con un email random invalidado por regla local + captura del error — si Supabase responde con éxito o con error tipo "email already registered" en vez de "signups disabled", asumimos que están abiertos. Alternativa más limpia: pegarle a la Management API para leer la config (requiere `SUPABASE_ACCESS_TOKEN` que no queremos meter en Vercel). Decisión de arquitectura documentada en sección 10.

No incluye:
- Rate limiting (fuera de alcance — Supabase Auth ya trae rate limit propio).
- 2FA para el admin (fuera de MVP).
- Rotación de contraseña programática (el admin puede hacerlo desde `/admin` en el futuro, pero este módulo no lo agrega).
- Auditoría/log de cambios de platos (fuera de MVP).
- Bloquear IPs / hardening a nivel Vercel/CDN (fuera del alcance de código de app).

## 4. Requisitos funcionales

- FR-001 — Toda Server Action del admin que muta datos (`createDish`, `updateDish`, `deleteDish`, `toggleDishActive`, `createCategory`, `updateCategory`, `deleteCategory`) debe llamar `requireAdmin()` como primera operación. Si falla, la acción retorna `{ error }` con mensaje genérico sin ejecutar la mutación.
- FR-002 — Toda Server Action del admin debe pasar los errores de Supabase por `sanitizeActionError()` antes de retornarlos al cliente. El detalle real del error se loguea con `console.error` server-side (visible en Vercel Logs) pero no viaja al browser.
- FR-003 — Las categorías de error reconocidas devuelven un mensaje humano específico:
  - `foreign key` / `violates foreign key constraint` → "No se puede completar: hay datos relacionados que dependen de este registro."
  - `unique` / `duplicate key` → "Ya existe un registro con esos datos."
  - `permission denied` / `row-level security` → "No tenés permiso para hacer esto."
  - `storage` / `bucket` → "Error al subir el archivo. Volvé a intentar."
  - default → "Ocurrió un error. Volvé a intentar."
- FR-004 — La página `/admin` debe mostrar un banner de advertencia si detecta que los sign-ups de Supabase Auth siguen abiertos, con instrucción concreta ("Andá al dashboard de Supabase → Authentication → Providers → Email, desactivá 'Allow new users to sign up'"). Si están cerrados (o el check no pudo determinarlo por error), no muestra nada.

## 5. Requisitos no funcionales

- NFR-001 — La sanitización de errores no debe cambiar el shape del return (`{ error: string }`) — es un cambio interno transparente para los callers.
- NFR-002 — `requireAdmin()` no debe agregar más de 1 llamada extra a Supabase por Server Action (reusa el cliente ya creado por la acción).
- NFR-003 — El check de sign-ups debe ejecutarse **sólo en el render de `/admin`** (no en cada Server Action) y con timeout razonable — si tarda más de 3s, se skippea y no muestra banner.
- NFR-004 — Los mensajes al admin deben ser en español, consistentes con el resto de la UI.

## 6. Arquitectura del módulo

**Archivos nuevos:**
- `src/lib/errors/sanitize.ts` — export `sanitizeActionError(error: unknown, fallback?: string): string`. Loguea con `console.error(prefix, error)`, matchea por keyword contra el mensaje del error (case-insensitive), devuelve string. También exporta `type ActionResult<T = void> = { error: string } | (T extends void ? undefined : { data: T })` para tipar returns uniformemente si hace falta más adelante (opcional, no requerido).
- `src/lib/auth/require-admin.ts` — export `requireAdmin(supabase?: SupabaseClient): Promise<User>`. Si no le pasan cliente, crea uno con `createClient()` (server). Llama `getUser()`. Si `!user`, arroja `AuthRequiredError` — un error tipado que `sanitizeActionError` reconoce y traduce a "Sesión expirada. Refrescá la página." (agregar a la lista de categorías en FR-003).
- `src/lib/auth/signups-status.ts` — export `areSignupsOpen(): Promise<boolean | null>`. Intenta un `supabase.auth.signUp` con un email obviamente inválido de dominio reservado (`hardening-probe+<timestamp>@example.invalid`) usando un cliente **anon** (no service role). Si Supabase responde con error mensajeando "signups disabled" (o similar), retorna `false`. Cualquier otra respuesta (éxito, "email invalid", "rate limit") → `true` (asumimos peor caso). Si la llamada falla por red/timeout → `null` (no mostrar banner). Envuelto en `Promise.race` con `setTimeout(3000)`.
- `src/app/admin/SignupsWarning.tsx` — Server Component (o async React server component) que renderiza el banner sólo si `areSignupsOpen()` devuelve `true`.

**Archivos modificados:**
- `src/app/admin/dishes/actions.ts` — envolver todas las funciones con `requireAdmin()` + `sanitizeActionError()`.
- `src/app/admin/categories/actions.ts` — idem.
- `src/app/admin/logout/actions.ts` — sólo sanitize (logout no requiere admin — al revés, requiere estar logueado, pero si no lo está el redirect ya funciona).
- `src/app/admin/login/actions.ts` — sólo sanitize (por definición sin sesión previa).
- `src/app/admin/dishes/[id]/edit/page.tsx` — la bound action `boundUpdate` sigue reusando `updateDish` que ya trae el guard, no toco esto.
- `src/app/admin/page.tsx` — insertar `<SignupsWarning />` arriba del contenido.

## 7. Flujo de datos

**Server Action con guard + sanitize:**
```
Cliente dispara Server Action
  → requireAdmin(supabase)
    → getUser() → si no hay user, throw AuthRequiredError
  → mutación en Supabase
  → si error: sanitizeActionError(error) → console.error + return { error: "mensaje humano" }
  → si OK: revalidatePath + return
```

**Check de sign-ups:**
```
Render de /admin
  → SignupsWarning (server) llama areSignupsOpen()
    → supabase.auth.signUp({ email: "hardening-probe+<ts>@example.invalid", password: "..." })
    → Promise.race con timeout 3s
  → si true: renderiza banner con instrucción
  → si false | null: nada
```

## 8. Modelo de datos
Sin cambios.

## 9. API
Sin endpoints nuevos. Sólo cambian returns de Server Actions existentes (mensaje de error más humano, mismo shape).

## 10. Seguridad

**Decisión de arquitectura — cómo detectar sign-ups abiertos:**
- **Opción A (elegida):** intento de `signUp` con email de dominio reservado (`.invalid` per RFC 2606). Ventaja: sólo usa la anon key ya pública, no requiere secretos nuevos. Desventaja: si Supabase cambia el mensaje de error, el matcher puede fallar (fallback a "asumir abiertos" es conservador y seguro).
- **Opción B (descartada):** llamar a la Supabase Management API (`GET /v1/projects/{ref}/config/auth`) — requiere `SUPABASE_ACCESS_TOKEN` (token personal de dilan), no queremos meter secretos de nivel management en runtime de Vercel.
- **Opción C (descartada):** desactivar sign-ups via SQL/DB — Supabase no expone la config de Auth por SQL (vive en GoTrue, no en Postgres).

**Consideraciones adicionales:**
- El email de probe (`hardening-probe+<ts>@example.invalid`) usa un dominio TLD reservado por IANA — nunca puede resolver a un mail real, no llega spam a nadie.
- Se ejecuta desde el server component `/admin` — sólo se dispara cuando el admin (ya autenticado por middleware) entra a la home del admin. No es un check periódico.
- Si Supabase termina rate-limitando el probe, el `catch → null` evita mostrar banner falso positivo. Cada intento va contra el mismo rate limit compartido de auth, pero al ser una llamada por render manual de `/admin`, el volumen es despreciable.

## 11. Dependencias

Módulos:
- M03 (auth admin) — COMPLETED — proporciona el middleware y el layout admin donde va el banner.
- M04 (CRUD platos) — COMPLETED — este módulo modifica sus Server Actions.

Librerías: ninguna nueva.

Config: ninguna nueva.

## 12. Criterios de aceptación

- CA-001 — Llamar cualquier Server Action mutante (`createDish`, `updateDish`, `deleteDish`, `toggleDishActive`, `createCategory`, `updateCategory`, `deleteCategory`) sin sesión activa (cookie borrada) devuelve `{ error: "Sesión expirada. Refrescá la página." }` y **no** ejecuta la mutación (verificable comparando SQL antes/después).
- CA-002 — Provocar un error de Postgres específico (e.g. crear una categoría con nombre duplicado si hay unique) devuelve `{ error: "Ya existe un registro con esos datos." }`, y el log server-side (Vercel Logs) muestra el error crudo con contexto (`console.error("createCategory failed:", ...)`).
- CA-003 — El error genérico de Storage (subir a un bucket inexistente, por ejemplo) devuelve `{ error: "Error al subir el archivo. Volvé a intentar." }` y no filtra el nombre interno del bucket.
- CA-004 — Con sign-ups **abiertos** en Supabase, entrar a `/admin` muestra el banner con instrucción para desactivarlos.
- CA-005 — Con sign-ups **cerrados** en Supabase (después de que dilan los desactive), entrar a `/admin` **no** muestra el banner.
- CA-006 — Si la llamada de probe falla por timeout (simulable cortando red), `/admin` renderiza normalmente sin banner y sin romper la página.
- CA-007 — El shape del return de todas las Server Actions modificadas sigue siendo `{ error: string } | undefined` (o el shape existente que ya tenían) — no se rompe ningún caller existente.
