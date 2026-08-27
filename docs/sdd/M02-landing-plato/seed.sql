-- ============================================================
-- M02 seed — 3D Bar Menu 3D
-- ============================================================
-- Cómo aplicar:
--   1. Ir al dashboard del proyecto Supabase.
--   2. SQL Editor → New query → pegar TODO este archivo → Run.
--   3. Storage → crear buckets "models", "photos", "thumbnails"
--      (public read) manualmente desde la UI.
--   4. Subir a "models" un archivo .glb de ejemplo (RealityScan)
--      y actualizar la fila SEED-M02-CON-3D con el URL público.
--
-- Este seed es TEMPORAL — se borra al implementar M04 (CRUD admin).
-- Todas las filas están marcadas con description prefix "SEED-M02".
-- ============================================================

-- extensiones
create extension if not exists "pgcrypto";

-- ---------- tablas ------------------------------------------
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists dishes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10,2) not null default 0,
  category_id uuid references categories(id) on delete set null,
  photo_url text,
  model_url text,
  thumbnail_url text,
  sort_order int default 0,
  active boolean not null default true,
  created_at timestamptz default now()
);

create index if not exists dishes_active_idx on dishes(active);
create index if not exists dishes_category_idx on dishes(category_id);

-- ---------- RLS ---------------------------------------------
alter table categories enable row level security;
alter table dishes enable row level security;

-- Lectura pública de categorías (necesaria para join en M02)
drop policy if exists categories_public_read on categories;
create policy categories_public_read
  on categories for select
  to anon, authenticated
  using (true);

-- Lectura pública de platos activos (M02 requirement)
drop policy if exists dishes_public_read on dishes;
create policy dishes_public_read
  on dishes for select
  to anon, authenticated
  using (active = true);

-- (Las policies de escritura las agrega M03/M04)

-- ---------- seed data ---------------------------------------
-- Limpieza previa (por si se corre 2 veces)
delete from dishes where description like 'SEED-M02%';
delete from categories where name in ('Entradas', 'Principales', 'Tragos');

-- Categorías
with c as (
  insert into categories (name, sort_order) values
    ('Entradas', 1),
    ('Principales', 2),
    ('Tragos', 3)
  returning id, name
)
insert into dishes (name, description, price, category_id, photo_url, model_url, thumbnail_url, sort_order)
select
  d.name, d.description, d.price, c.id, d.photo_url, d.model_url, d.thumbnail_url, d.sort_order
from (values
  -- Un plato CON model_url — para validar visor 3D (reemplazar URL tras subir .glb)
  ('Hamburguesa Doble Carne',
   'SEED-M02-CON-3D | Doble medallón de carne, cheddar madurado, cebolla caramelizada, pan brioche artesanal.',
   9800, 'Principales',
   'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200',
   'REPLACE_WITH_STORAGE_URL_AFTER_UPLOAD.glb',
   'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
   1),
  -- Platos SIN model_url — para validar estado "próximamente" (FR-005)
  ('Provoleta',
   'SEED-M02-SIN-3D | Provoleta a la parrilla con orégano, ají molido y tostadas.',
   6500, 'Entradas',
   'https://images.unsplash.com/photo-1541784302-e0c9c48c0b62?w=1200',
   null,
   'https://images.unsplash.com/photo-1541784302-e0c9c48c0b62?w=400',
   1),
  ('Empanadas de carne (3u)',
   'SEED-M02-SIN-3D | Empanadas de carne cortada a cuchillo, cocinadas al horno de barro.',
   4200, 'Entradas',
   'https://images.unsplash.com/photo-1601924582970-9238bcb495d9?w=1200',
   null,
   'https://images.unsplash.com/photo-1601924582970-9238bcb495d9?w=400',
   2),
  ('Fernet con cola',
   'SEED-M02-SIN-3D | El clásico. Servido con hielo abundante.',
   3800, 'Tragos',
   'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1200',
   null,
   'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400',
   1)
) as d(name, description, price, category_name, photo_url, model_url, thumbnail_url, sort_order)
join c on c.name = d.category_name;

-- ---------- salida útil -------------------------------------
-- Al terminar, correr:
--   select id, name, model_url from dishes where description like 'SEED-M02%';
-- para copiar el UUID del plato con 3D y probar /menu/<uuid>.
