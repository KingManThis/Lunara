// Offline support. All data is in localStorage, so the app works fully offline once loaded.
const CACHE = "lunara-v1";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  if (req.mode === "navigate") {
    const shell = new URL("./", self.registration.scope).href;
    event.respondWith((async () => {
      try {
        const res = await fetch(req, { cache: "no-cache" });
        if (res.ok) (await caches.open(CACHE)).put(shell, res.clone());
        return res;
      } catch {
        return (await caches.match(shell)) ?? Response.error();
      }
    })());
    return;
  }
  if (/\/(assets|icons)\//.test(url.pathname) || url.pathname.endsWith(".webmanifest")) {
    event.respondWith((async () => {
      const hit = await caches.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) (await caches.open(CACHE)).put(req, res.clone());
      return res;
    })());
  }
});
