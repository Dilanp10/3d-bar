# 3D Bar — Menu 3D

App para el 3D Bar donde cada plato de la carta tiene un QR que, al escanearse, abre una URL con el plato en 3D interactivo. Un admin único (dueño del bar) carga los platos con sus modelos `.glb` generados en el celular con **RealityScan** (Epic Games, gratis).

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS**
- **Supabase** — Postgres + Auth + Storage
- **`<model-viewer>`** de Google para el visor 3D (soporta AR nativo en iOS/Android)
- **`@gltf-transform`** para optimización de `.glb` (Draco + KTX2)
- **`qrcode`** para generar QRs
- **Deploy: Vercel**

## Setup local

1. Copiar variables de entorno:

   ```bash
   cp .env.example .env.local
   ```

2. Completar `.env.local` con los valores de tu proyecto Supabase (ver
   [supabase.com/dashboard](https://supabase.com/dashboard)).

3. Instalar dependencias y correr:

   ```bash
   npm install
   npm run dev
   ```

   La app queda en http://localhost:3000

## Estructura

```
docs/sdd/            # SDDs por módulo (fuente de verdad del diseño)
  PROJECT.md         # estado de todos los módulos
src/
  app/               # rutas Next.js App Router
  lib/supabase/      # clientes Supabase (browser + server)
public/              # assets estáticos
```

## Estado de módulos

Ver [`docs/sdd/PROJECT.md`](./docs/sdd/PROJECT.md).

## Metodología

Desarrollo guiado por SDDs modulares — cada módulo tiene su `SDD.md` aprobado
antes de escribir código de negocio. Setup de infra (este módulo M01) es la
única excepción.
