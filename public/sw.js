// Service worker mínimo para Bar Sharif Menu.
// Estrategia:
//   - HTML / navegación: network-first, fallback a cache si estás offline.
//   - Assets estáticos (/_next/static, /icons, etc.): cache-first.
//   - Peticiones a Supabase (*.supabase.co): NUNCA cachear (datos dinámicos).
//
// Se re-registra automáticamente cuando cambia el hash del archivo.

const VERSION = "v1";
const STATIC_CACHE = `sharif-static-${VERSION}`;
const SHELL_CACHE = `sharif-shell-${VERSION}`;

const SHELL_URLS = ["/", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.endsWith(VERSION))
          .map((k) => caches.delete(k)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== "GET") return;
  if (url.hostname.endsWith("supabase.co")) return; // no cachear

  // Assets estáticos: cache-first
  if (url.pathname.startsWith("/_next/static") || url.pathname.startsWith("/icons")) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      }),
    );
    return;
  }

  // HTML / navegación: network-first
  if (req.mode === "navigate" || req.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL_CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match("/"))),
    );
  }
});
