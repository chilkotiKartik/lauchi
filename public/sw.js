/* lockin. service worker: offline fallback, recent study pages, and Web Push.
   Rules: never touch /api/**, auth routes or non-GET requests. Bump VERSION to drop every old cache. */
const VERSION = "v1";
const STATIC = `lockin-static-${VERSION}`;
const PAGES = `lockin-pages-${VERSION}`;
const OFFLINE = "/offline";
const MAX_PAGES = 40;
// Pages worth keeping for the next time the student has no signal.
const KEEP = [/^\/learn(\/|$)/, /^\/formulas(\/|$)/, /^\/pyq(\/|$)/];
const NEVER = [/^\/api\//, /^\/auth\//, /^\/login/, /^\/welcome/, /^\/admin/];
const PRECACHE = ["/icons/icon-192.png", "/icons/icon-512.png", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC);
    await Promise.all(PRECACHE.map((u) => cache.add(u).catch(() => {})));
    // Keep the offline page together with the CSS/JS it needs to render.
    try {
      const res = await fetch(OFFLINE, { credentials: "same-origin" });
      if (res.ok) {
        const html = await res.clone().text();
        await cache.put(OFFLINE, res);
        const assets = new Set();
        for (const m of html.matchAll(/(?:href|src)="(\/_next\/static\/[^"]+)"/g)) assets.add(m[1]);
        await Promise.all([...assets].map((u) => cache.add(u).catch(() => {})));
      }
    } catch { /* offline during install: the page is cached on first online visit instead */ }
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keep = new Set([STATIC, PAGES]);
    for (const k of await caches.keys()) if (k.startsWith("lockin-") && !keep.has(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

const matches = (list, path) => list.some((r) => r.test(path));

async function trim(cache) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - MAX_PAGES; i++) await cache.delete(keys[i]);
}

async function pageRequest(request, url) {
  const cache = await caches.open(PAGES);
  const keepable = matches(KEEP, url.pathname);
  try {
    const res = await fetch(request);
    // A redirect usually means "sign in first": never store that under a study page.
    if (keepable && res.ok && !res.redirected && res.type === "basic") {
      await cache.put(url.pathname + url.search, res.clone());
      await trim(cache);
    }
    return res;
  } catch {
    const hit = keepable ? await cache.match(url.pathname + url.search) : undefined;
    if (hit) return hit;
    const off = await (await caches.open(STATIC)).match(OFFLINE);
    return off || Response.error();
  }
}

async function staticRequest(request) {
  const cache = await caches.open(STATIC);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok && res.type === "basic") cache.put(request, res.clone());
  return res;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (matches(NEVER, url.pathname)) return;

  if (request.mode === "navigate") {
    event.respondWith(pageRequest(request, url));
    return;
  }
  // Hashed build files never change, so they can be served straight from the cache.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(staticRequest(request));
  }
});

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { /* plain text push */ }
  const title = typeof data.title === "string" && data.title ? data.title : "lockin.";
  event.waitUntil(self.registration.showNotification(title, {
    body: typeof data.body === "string" ? data.body : "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: typeof data.tag === "string" ? data.tag : "lockin",
    data: { url: typeof data.url === "string" && data.url.startsWith("/") ? data.url : "/home" },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL((event.notification.data && event.notification.data.url) || "/home", self.location.origin).href;
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of all) {
      if ("focus" in c) { await c.focus(); if ("navigate" in c) { try { await c.navigate(target); } catch { /* cross-origin */ } } return; }
    }
    await self.clients.openWindow(target);
  })());
});
