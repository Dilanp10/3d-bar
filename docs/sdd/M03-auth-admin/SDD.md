# SDD — M03: Autenticación del admin

## 1. Identificación
Module: M03
Name: Autenticación del admin
Status: Approved
Approved: 2026-08-21 (reconciliado retroactivamente — código reescrito para cumplir SDD)

## 2. Objetivo

Proteger las rutas `/admin/*` con autenticación email/password usando Supabase Auth. Un único admin (dueño del Bar Sharif) puede iniciar y cerrar sesión, y solo con sesión válida puede acceder al panel de gestión de platos (que se implementa en M04). El módulo también define la mitad "escritura" de RLS sobre `dishes` y `categories`, complementando la mitad "lectura pública" que ya sentó M02.

## 3. Alcance

### Incluye
- Middleware de Next 16 (`src/middleware.ts`) que refresca la sesión en cada request usando `@supabase/ssr` (patrón oficial recomendado).
- Cliente Supabase para middleware (`src/lib/supabase/middleware.ts`).
- Ruta `/admin/login` con formulario email + password (Server Component + Server Action).
- Ruta `/admin` como placeholder del panel (dashboard vacío + link "Cargar platos → M04").
- Server Action `signIn(email, password)` que autentica y redirige.
- Server Action `signOut()` invocada desde un botón en el layout de admin.
- Layout `/admin/layout.tsx` que verifica sesión en el Server y redirige a `/admin/login` si no hay usuario.
- Redirect inverso: si el usuario ya está autenticado y visita `/admin/login`, va a `/admin`.
- Manejo de error de login con mensaje genérico ("email o contraseña incorrectos") sin filtrar cuál campo falló.
- Migración SQL con las policies de escritura (`dishes_admin_write`, `categories_admin_write`) para rol `authenticated`.
- Instrucciones para crear el único usuario admin manualmente desde el dashboard de Supabase (Authentication → Users → Add user).

### No incluye (queda fuera / es de otro módulo)
- CRUD visual de platos → M04.
- Sign-up público (no queremos que se registre cualquiera).
- Reset password vía email → opcional para M07 (Supabase lo trae "out of the box", solo hay que habilitarlo en el dashboard).
- MFA / 2FA → fuera del MVP.
- Múltiples admins → el diseño soporta N usuarios `authenticated`; el bar solo crea uno.
- Roles diferenciados (admin, mozo) → futuro, si aparece el rol mozo.
- Storage policies para `.glb`, `photos` → parte de M05.

## 4. Requisitos funcionales

- **FR-001** — `/admin/login` renderiza un formulario email+password con validación básica y botón "Iniciar sesión".
- **FR-002** — Al acceder a `/admin` o cualquier ruta `/admin/*` sin sesión válida, se redirige a `/admin/login`.
- **FR-003** — Existe un botón "Cerrar sesión" en el layout de admin que invoca `signOut()` y redirige a `/admin/login`.
- **FR-004** — La sesión persiste en cookies HTTP-only refrescadas por middleware en cada request; sobrevive al cierre de pestaña dentro del período de expiración configurado por Supabase (default 1 h con refresh silencioso).
- **FR-005** — Si las credenciales son inválidas, la página de login muestra un único mensaje genérico "email o contraseña incorrectos". El backend no debe distinguir "usuario no existe" vs "password incorrecto" ni por mensaje ni por timing.
- **FR-006** — Las tablas `dishes` y `categories` tienen policies RLS que permiten `insert/update/delete` solo al rol `authenticated`. Las policies de `select` públicas de M02 quedan intactas.
- **FR-007** — Si un usuario ya autenticado visita `/admin/login`, es redirigido a `/admin`.
- **FR-008** — El sign-out revoca la sesión del lado servidor (cookie borrada) y del lado cliente (state limpio); reload posterior redirige a login.

## 5. Requisitos no funcionales

- **NFR-001** — Cookies de sesión con flags `HttpOnly`, `SameSite=Lax`, `Secure` en producción, `Path=/`.
- **NFR-002** — Rate limiting del endpoint de login: usar el rate limiter nativo de Supabase Auth (max 30 requests / IP / 5 min por default). No implementar limiter propio en el MVP.
- **NFR-003** — Password policy mínima 8 caracteres (configurable en el dashboard de Supabase Auth). No permitir passwords comunes (activar en dashboard).
- **NFR-004** — Sin JWT en `localStorage`. Todo el auth va por cookies HTTP-only manejadas por `@supabase/ssr`.
- **NFR-005** — El middleware debe refrescar la sesión sin lanzar errores de "cookies fuera de un Server Action / Route Handler" — el patrón oficial usa `NextResponse` para propagar los `Set-Cookie`.
- **NFR-006** — Sign-in debe completar en ≤ 500 ms bajo condiciones normales (limitado por Supabase Auth roundtrip).
- **NFR-007** — La UI de login sigue la paleta bar-lounge establecida en M02.

## 6. Arquitectura del módulo

```
src/
  middleware.ts                       # Next middleware — refresh + guard
  lib/
    supabase/
      middleware.ts                   # createClient(request, response) para el middleware
  app/
    admin/
      layout.tsx                      # Server Component — verifica sesión, redirect
      page.tsx                        # Dashboard placeholder (link a M04)
      LogoutButton.tsx                # Client Component — invoca Server Action
      logout/
        actions.ts                    # "use server" — signOut()
      login/
        page.tsx                      # Formulario (Server Component + form action)
        LoginForm.tsx                 # Client Component para manejo de estado del form
        actions.ts                    # "use server" — signIn(prevState, formData)
```

### Componentes y responsabilidades

| Archivo | Tipo | Responsabilidad |
|---|---|---|
| `middleware.ts` | Next middleware | En cada request bajo `/admin/*` o `/admin/login`, refresca la sesión llamando a `supabase.auth.getUser()` (importante: NO `getSession()` — se ignoran cookies falsificadas). Propaga cookies `Set-Cookie` vía `NextResponse`. Redirige `/admin/*` → `/admin/login` si no hay user. |
| `lib/supabase/middleware.ts` | Server helper | Crea un cliente Supabase con `createServerClient` que lee/escribe cookies del `NextRequest` y las propaga al `NextResponse`. |
| `admin/layout.tsx` | Server Component | Doble check: si el middleware fallara, este layout llama `supabase.auth.getUser()` y redirige si null. Renderiza header con nombre del admin + botón de logout. |
| `admin/page.tsx` | Server Component | Dashboard placeholder ("Bienvenido. Panel de platos: en construcción"). |
| `admin/login/page.tsx` | Server Component | Chequea si ya hay sesión → redirect `/admin`. Si no, renderiza `<LoginForm>`. |
| `admin/login/LoginForm.tsx` | Client Component | Estado del form + `useActionState` con la Server Action `signIn`. Muestra error genérico. |
| `admin/login/actions.ts` | Server Action | `signIn(prevState, formData)`: valida con zod (email + password ≥ 8), llama `supabase.auth.signInWithPassword`, si falla devuelve `{ error: "..." }` (mensaje genérico), si OK `redirect("/admin")`. |
| `admin/logout/actions.ts` | Server Action | `signOut()`: `supabase.auth.signOut()` + `redirect("/admin/login")`. |
| `admin/LogoutButton.tsx` | Client Component | Botón que invoca la Server Action `signOut`. |

## 7. Flujo de datos

### Acceso a ruta protegida
```
Cliente → GET /admin
   → middleware.ts
       → createClient(request, response)
       → supabase.auth.getUser()  // refresh cookies
       → si !user y path.startsWith("/admin") y path !== "/admin/login":
           → NextResponse.redirect("/admin/login")
       → else: response con cookies actualizadas
   → app/admin/layout.tsx (Server Component)
       → supabase.auth.getUser() (defensa en profundidad)
       → si !user: redirect("/admin/login")
   → renderiza admin/page.tsx
```

### Login
```
Usuario → /admin/login → completa email+pass → submit
   → Server Action signIn(prevState, formData)
       → zod parse: email válido, password ≥ 8 chars
       → supabase.auth.signInWithPassword({email, password})
           → si error: return { error: "Email o contraseña incorrectos" }
           → si ok: Supabase set cookies HTTP-only
       → redirect("/admin")
   → Cliente recibe 303 → GET /admin → middleware ve cookie → OK
```

### Logout
```
Usuario click "Cerrar sesión"
   → Server Action signOut()
       → supabase.auth.signOut()
       → redirect("/admin/login")
```

## 8. Modelo de datos

Este módulo **no crea tablas de aplicación**. Usa `auth.users` que Supabase provee nativamente.

Agrega las siguientes **policies RLS** (migración `M03_auth_write_policies`):

```sql
-- Solo authenticated puede escribir en dishes
create policy dishes_admin_write on dishes
  for all
  to authenticated
  using (true)
  with check (true);

-- Solo authenticated puede escribir en categories
create policy categories_admin_write on categories
  for all
  to authenticated
  using (true)
  with check (true);
```

Las policies de `select` público de M02 quedan intactas — los clientes anónimos siguen viendo los platos activos.

**Creación del usuario admin (manual):**
1. Dashboard Supabase → Authentication → Users → "Add user" → "Send invite" o "Create new user".
2. Usar el email real del dueño del bar y una password fuerte.
3. NO habilitar sign-up en Authentication → Providers → Email (mantener "Enable sign-ups" en OFF).

## 9. API

Este módulo no expone HTTP propio. Usa Server Actions internas (transporte automático de Next):

- `signIn(prevState, formData) → { error?: string } | never` (redirige en éxito)
- `signOut() → never` (siempre redirige)

Ambas usan cookies HTTP-only manejadas por `@supabase/ssr`.

## 10. Seguridad

- **Cookies HTTP-only + SameSite Lax + Secure** en producción — protege contra XSS y CSRF cross-site.
- **CSRF nativo** de Server Actions de Next (token en la respuesta del RSC, verificado en cada action).
- **Sign-up deshabilitado** en el dashboard → nadie puede autoregistrarse.
- **Mensaje de error genérico** en login (FR-005) → no revela existencia del usuario.
- **RLS estricto** → aunque un atacante consiguiera el anon key, no puede escribir.
- **Middleware refresh** → tokens rotan silenciosamente; una sesión robada tiene ventana corta.
- **No exponer service_role_key** en ningún path público (solo se usa en API Routes que M03 no crea).
- **Password policy** ≥ 8 caracteres, "compromised passwords" bloqueadas (config en dashboard).
- **Timing consistente** en el login: si el email no existe, `signInWithPassword` de Supabase ya devuelve en tiempo comparable — no implementamos lógica propia que ramifique según existencia del user.
- **Sign-out**: server-side (`.signOut()`) y limpieza de cookie garantizada.

## 11. Dependencias

### Módulos internos
- **M01 (COMPLETED)** — clientes Supabase base ya presentes. Requerido.
- **M02 (TESTING)** — no depende directamente de la funcionalidad, pero se agrega el middleware en un mismo `src/middleware.ts`; hay que garantizar que la ruta `/menu/[id]` **NO** sea afectada por el guard (matcher del middleware excluye `/menu/*`).

### Infraestructura externa (bloqueante)
- **Proyecto Supabase real** creado (pendiente).
- **Usuario admin creado a mano** en Supabase Auth (una única vez).
- **Sign-ups deshabilitados** en Authentication → Providers → Email.
- **Migración M03** aplicada tras la migración M02 (`seed.sql`).

### Librerías externas
- `@supabase/ssr` — ya instalado en M01.
- Ningún paquete nuevo.

## 12. Criterios de aceptación

- **CA-001** — Visitar `/admin` sin cookie de sesión redirige a `/admin/login` (HTTP 307/308).
- **CA-002** — Login con credenciales correctas redirige a `/admin` y setea cookie HTTP-only (`sb-...`) verificable en devtools → Network.
- **CA-003** — Login con credenciales inválidas muestra "Email o contraseña incorrectos" sin distinguir campo. Ningún leak informativo.
- **CA-004** — Botón "Cerrar sesión" desde `/admin` cierra la sesión (cookie borrada) y redirige a `/admin/login`; reload posterior queda en login.
- **CA-005** — Usuario autenticado que visita `/admin/login` es redirigido a `/admin`.
- **CA-006** — Cookies emitidas por el login incluyen los flags `HttpOnly`, `SameSite=Lax`, y `Secure` cuando `NODE_ENV=production`.
- **CA-007** — Un `curl` con solo el anon key intentando `POST /rest/v1/dishes` devuelve error 401/403 por RLS (`dishes_admin_write` no permite anon).
- **CA-008** — Un `curl` con solo el anon key haciendo `GET /rest/v1/dishes?active=eq.true` sigue devolviendo los platos activos (policy de M02 intacta).
- **CA-009** — El middleware NO afecta rutas públicas: `/`, `/menu/[id]`, `/manifest.webmanifest`, `/sw.js`, `/icons/*`, `/_next/*` siguen accesibles sin sesión.
- **CA-010** — Sign-ups deshabilitados: intentar `supabase.auth.signUp` desde el cliente (probado con SQL o curl) responde error "signups are disabled".
