# Tasks — M03: Autenticación del admin

Fuente: [SDD.md](./SDD.md) (Approved)

Nota: implementación reconciliada retroactivamente. El código se escribió antes de crear estas tasks; después se refactorizó para cumplir el SDD y se documentó acá el resultado final.

## TASK-001 — Helper Supabase para middleware
Status: COMPLETED
Satisfies: NFR-005

Descripción:
Crear `src/lib/supabase/middleware.ts` con `createClient(request)` que devuelve un cliente Supabase + un getter del NextResponse mutado. Debe propagar Set-Cookie desde/hacia el request usando `@supabase/ssr`.

Completed:
- Helper que expone `{ supabase, response }`. `getAll/setAll` mutan request y response de forma coordinada (patrón oficial Supabase para Next 16).

Files:
- src/lib/supabase/middleware.ts

SDD requirements satisfied:
- NFR-005

## TASK-002 — Middleware con refresh + guard + redirect inverso
Status: COMPLETED
Satisfies: FR-002, FR-004, FR-007, CA-009

Descripción:
`src/middleware.ts` invoca el helper, llama `supabase.auth.getUser()` (nunca `getSession()`), redirige a `/admin/login` si no hay user, y a `/admin` si el user autenticado visita `/admin/login`. Matcher restringido a `/admin/:path*` para no afectar `/`, `/menu/*`, `/manifest.webmanifest`, `/sw.js`, `/icons/*`, `/_next/*`.

Completed:
- getUser validado server-side, sin path para cookies falsificadas. Redirect 307 (default NextResponse.redirect).

Files:
- src/middleware.ts

SDD requirements satisfied:
- FR-002, FR-004, FR-007, CA-009

## TASK-003 — Página de login: Server Component + LoginForm client
Status: COMPLETED
Satisfies: FR-001, FR-007, NFR-007

Descripción:
`/admin/login/page.tsx` como Server Component: chequea sesión con `getUser()` y redirige si ya está autenticado. Renderiza `<LoginForm />` (Client Component) con `useActionState` + campos email/password, botón submit y área para el error genérico.

Completed:
- page.tsx server-side gate + LoginForm client component. Paleta bar-lounge (background-panel, accent ámbar, border-border). `autocomplete="email"`/`current-password` para managers.

Files:
- src/app/admin/login/page.tsx
- src/app/admin/login/LoginForm.tsx

SDD requirements satisfied:
- FR-001, FR-007, NFR-007

## TASK-004 — Server Action signIn con zod y mensaje genérico
Status: COMPLETED
Satisfies: FR-005, NFR-003, NFR-006, CA-003

Descripción:
`src/app/admin/login/actions.ts` con `signIn(prevState, formData)`: valida `{ email: z.email(), password: z.string().min(8) }`, llama `supabase.auth.signInWithPassword`, si algo falla (parse o auth) devuelve **siempre** `{ error: "Email o contraseña incorrectos" }`. En éxito, `redirect("/admin")`.

Completed:
- Constante `GENERIC_ERROR` única en el módulo. No hay path que devuelva el mensaje literal de Supabase. Zod cubre validación server-side (min 8 chars y email válido).

Files:
- src/app/admin/login/actions.ts

SDD requirements satisfied:
- FR-005, NFR-003, NFR-006, CA-003

## TASK-005 — Server Action signOut y LogoutButton
Status: COMPLETED
Satisfies: FR-003, FR-008, CA-004

Descripción:
`src/app/admin/logout/actions.ts` con `signOut()`: `supabase.auth.signOut()` + `redirect("/admin/login")`. `src/app/admin/LogoutButton.tsx` (client) importa y llama la action.

Completed:
- Logout separado en su propia ruta según SDD. Button invocado desde la nav del layout admin.

Files:
- src/app/admin/logout/actions.ts
- src/app/admin/LogoutButton.tsx

SDD requirements satisfied:
- FR-003, FR-008, CA-004

## TASK-006 — Admin layout con guard defensivo + nav
Status: COMPLETED
Satisfies: FR-002, FR-003, NFR-007

Descripción:
`src/app/admin/layout.tsx` (Server Component): llama `getUser()` como defensa en profundidad (si el middleware fallara). Sin user devuelve `<>{children}</>` (así el login se renderiza sin nav). Con user renderiza nav (3D Bar Admin / Platos / Categorías / Salir) + main.

Completed:
- Guard doble (middleware + layout). Nav con paleta bar-lounge; LogoutButton en la esquina.

Files:
- src/app/admin/layout.tsx

SDD requirements satisfied:
- FR-002, FR-003, NFR-007

## TASK-007 — Migración m03_auth_write_policies (RLS de escritura)
Status: COMPLETED
Satisfies: FR-006, CA-007, CA-008

Descripción:
Migración SQL que aplica dos policies `FOR ALL TO authenticated USING(true) WITH CHECK(true)`: `dishes_admin_write` y `categories_admin_write`. Deja intactas las policies públicas de M02 (`dishes_public_read`, `categories_public_read`).

Completed:
- Migración `m03_auth_write_policies` aplicada. Reemplaza las 7 policies granulares que se habían creado antes del SDD (`m04_admin_rls_policies`, ahora superadas) por las 2 unificadas. `pg_policies` verificado: 4 total (2 read pública + 2 write auth).

Files:
- (Supabase project `gngbyxavebhlafxeidcx`)

SDD requirements satisfied:
- FR-006, CA-007, CA-008

## TASK-008 — Sign-ups OFF en Supabase Auth (acción del dueño)
Status: IN_PROGRESS
Satisfies: CA-010

Descripción:
Deshabilitar sign-ups desde el dashboard Supabase (Authentication → Providers → Email → "Enable sign-ups" OFF). Los settings de Auth no son modificables via MCP; requiere acción manual del dueño.

Pendiente:
- Confirmación del usuario de que aplicó el cambio en el dashboard.

Files:
- (config Supabase — dashboard)

SDD requirements satisfied:
- CA-010 (pendiente de confirmación)

## TASK-009 — Deploy y verificación end-to-end en producción
Status: COMPLETED
Satisfies: CA-001, CA-002, CA-004, CA-005

Descripción:
Deploy en Vercel con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` configuradas. Verificar en https://3d-bar.vercel.app: `/admin` sin sesión → redirect a login, login OK → panel platos, `/admin/login` con sesión → redirect a `/admin`, botón Salir → login y sesión vacía.

Completed:
- URL producción: https://3d-bar.vercel.app
- CA-001 verificado: `/admin` sin cookie redirige a `/admin/login`.
- CA-002 verificado: login con `dilanperea10@gmail.com` / `Sharif2024!` → redirige a `/admin` con cookie `sb-*` HttpOnly.
- CA-004 verificado: click Salir → sesión limpia → reload queda en login.
- CA-005 verificado: usuario logueado que vuelve a `/admin/login` redirige a `/admin`.

Files:
- (deploy Vercel, project `prj_n2OW88jNaw7V4V9HhHf643ujHNzj`)

SDD requirements satisfied:
- CA-001, CA-002, CA-004, CA-005
