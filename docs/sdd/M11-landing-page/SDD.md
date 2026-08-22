# SDD — M11: Landing page renovada

## 1. Identificación
Module: M11
Name: Landing page renovada
Status: Approved

## 2. Objetivo
La home (`/`) hoy es minimalista: título, descripción corta y dos links. M11 la convierte en una landing real: hero visual, info de contacto del bar (dirección/horarios/teléfono), links a redes sociales, y un preview de 4 platos destacados que linkean a `/menu` y a `/menu/[id]`.

**Nota importante:** el usuario pidió explícitamente usar datos ficticios ("hacelo ficticio o agarra cualquier bar") porque no tiene los datos reales del bar a mano todavía. Todo el contenido de negocio (dirección, horario, teléfono, Instagram) es **placeholder inventado**, centralizado en un solo archivo con un comentario bien visible, para que sea trivial de reemplazar antes de anunciar la URL públicamente.

## 3. Alcance

Incluye:
- Archivo `src/lib/content/business-info.ts` con las constantes de negocio (dirección, horario, teléfono/WhatsApp, Instagram), marcadas como placeholder con comentario destacado.
- Sección hero: imagen de fondo (reusa una foto de Unsplash ya usada como seed, mismo dominio ya whitelisteado en `next.config.ts`) + overlay oscuro + título + los dos CTAs existentes ("Ver la carta completa", link a admin).
- Sección "Visitanos": dirección + horario + teléfono, con link de dirección apuntando a Google Maps (búsqueda por texto, no requiere coordenadas reales) y de teléfono a WhatsApp (`wa.me`).
- Sección de redes: ícono/link a Instagram.
- Sección "Platos destacados": 4 cards (reusa `getPublicMenu()` de M10, toma los primeros 4 platos activos across todas las categorías) con link a `/menu/[id]` cada una, y un link "Ver todo" a `/menu`.
- Reescritura de `src/app/page.tsx` para ensamblar estas secciones.

No incluye:
- Panel de admin para editar estos datos (quedan hardcodeados en código — decisión ya tomada por el usuario: "datos estáticos que se hardcodean en el código").
- Mapa embebido interactivo (sólo un link a Google Maps, no un iframe).
- Múltiples redes sociales más allá de Instagram (se puede agregar Facebook/TikTok después sin rediseño, es sólo agregar una constante + un ícono).
- Reemplazar los datos ficticios por reales — eso es una tarea de "contenido", no de código; queda documentado como deuda en `PROJECT.md` igual que el TASK-008 de sign-ups.

## 4. Requisitos funcionales

- FR-001 — La home debe mostrar una sección hero con imagen de fondo, overlay, el título/descripción existente, y los dos CTAs actuales.
- FR-002 — Debe mostrar dirección, horario y teléfono del bar, leídos desde `src/lib/content/business-info.ts`.
- FR-003 — El texto de la dirección debe ser un link que abra Google Maps con esa dirección como búsqueda (`https://www.google.com/maps/search/?api=1&query=<dirección URL-encoded>`).
- FR-004 — El teléfono debe ser un link `https://wa.me/<numero>` (sin espacios ni símbolos, formato E.164).
- FR-005 — Debe haber un link a Instagram (ícono o texto "@handle") que abra el perfil en una pestaña nueva.
- FR-006 — Debe mostrar 4 platos destacados (los primeros 4 activos, en el mismo orden que ya usa `getPublicMenu()` — no requiere lógica de "featured" nueva en la DB) con foto, nombre, precio, cada uno linkeando a `/menu/[id]`.
- FR-007 — Debe haber un link "Ver la carta completa" (ya existente) que lleve a `/menu`.
- FR-008 — Si no hay ningún plato activo, la sección de destacados no se renderiza (sin empty state — la home no debe verse rota, simplemente omite la sección).

## 5. Requisitos no funcionales

- NFR-001 — La imagen del hero se sirve vía `next/image` con `priority` (es LCP) y `sizes` apropiado.
- NFR-002 — Los datos de negocio están en **un solo archivo** (`business-info.ts`) para que reemplazarlos sea un cambio de una sola ubicación.
- NFR-003 — El comentario de placeholder debe ser imposible de pasar por alto: bloque al inicio del archivo, en mayúsculas, explicando que son datos ficticios.
- NFR-004 — La página sigue siendo Server Component (sin JS extra en el cliente más allá de lo que ya existía).
- NFR-005 — Responsive: hero y secciones se ven bien en mobile (viewport principal, dado que se accede post-QR desde el celular) y desktop.

## 6. Arquitectura del módulo

**Archivos nuevos:**
- `src/lib/content/business-info.ts` — exporta:
  ```ts
  // ⚠️ PLACEHOLDER — datos ficticios. Reemplazar antes de lanzar públicamente.
  export const BUSINESS_NAME = "Bar Sharif";
  export const ADDRESS = "San Martín 456, San Fernando del Valle de Catamarca";
  export const HOURS = "Martes a Domingo · 19:00 a 02:00";
  export const PHONE_DISPLAY = "+54 9 383 456-7890";
  export const WHATSAPP_URL = "https://wa.me/5493834567890";
  export const INSTAGRAM_HANDLE = "@bar.sharif";
  export const INSTAGRAM_URL = "https://instagram.com/bar.sharif";
  export const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}`;
  export const HERO_IMAGE_URL = "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1600"; // placeholder, reemplazar por foto real del local
  ```
- `src/app/HeroSection.tsx` — Server Component, imagen de fondo + overlay + título + CTAs.
- `src/app/BusinessInfo.tsx` — Server Component, dirección/horario/teléfono/Instagram con los links armados.
- `src/app/FeaturedDishes.tsx` — Server Component async, llama `getPublicMenu()`, aplana las secciones (`sections.flatMap(s => s.dishes)`), toma los primeros 4, renderiza cards (mismo patrón visual que M10) + link "Ver todo".

**Archivos modificados:**
- `src/app/page.tsx` — reemplaza el contenido actual por `<HeroSection />` + `<FeaturedDishes />` + `<BusinessInfo />`.

## 7. Flujo de datos

```
GET /
  → page.tsx (Server Component)
    → <HeroSection /> (estático, lee business-info.ts)
    → <FeaturedDishes /> (async, llama getPublicMenu() de M10, toma primeros 4)
    → <BusinessInfo /> (estático, lee business-info.ts)
```

## 8. Modelo de datos
Sin cambios — reusa `getPublicMenu()` de M10.

## 9. API
Sin endpoints nuevos.

## 10. Seguridad
Sin cambios — contenido público estático + reutilización de queries de lectura pública ya existentes.

## 11. Dependencias

Módulos:
- M10 (vista pública del menú) — TESTING — provee `getPublicMenu()` que reusa este módulo.

Librerías: ninguna nueva.

## 12. Criterios de aceptación

- CA-001 — La home muestra la sección hero con imagen de fondo, título y los dos CTAs.
- CA-002 — La dirección mostrada es un link que abre Google Maps con esa dirección en una pestaña nueva.
- CA-003 — El teléfono mostrado es un link `wa.me` válido (formato E.164 sin símbolos).
- CA-004 — El link de Instagram abre el perfil correcto en pestaña nueva.
- CA-005 — Se muestran hasta 4 platos destacados con foto, nombre y precio, cada uno linkeando a `/menu/[id]` correcto.
- CA-006 — Si no hay platos activos, la home no rompe — simplemente no muestra la sección de destacados.
- CA-007 — El comentario de placeholder es visible al abrir `business-info.ts`.
- CA-008 — La home sigue siendo responsive en mobile (375px) y desktop.
