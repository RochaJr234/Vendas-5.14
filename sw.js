const CACHE = "controle-vendas-pwa-5.14.4";
const PRECACHE = ["./","./index.html","./style.css","./script.js","./manifest.webmanifest","./icon-192.png","./icon-512.png"];
self.addEventListener("install", event => { event.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("message", event => { if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting(); });
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  const isHTML = event.request.mode === "navigate" || url.pathname.endsWith("/index.html") || url.pathname.endsWith("/manifest.webmanifest");
  if (isHTML) {
    event.respondWith(fetch(event.request, {cache:"no-store"}).then(response => {
      if (response && response.ok) caches.open(CACHE).then(c => c.put(event.request, response.clone()));
      return response;
    }).catch(() => caches.match(event.request).then(r => r || caches.match("./index.html"))));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (response && response.ok) caches.open(CACHE).then(c => c.put(event.request, response.clone()));
    return response;
  }).catch(() => cached)));
});
