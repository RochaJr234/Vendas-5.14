const CACHE="controle-vendas-5.14.1";
const ASSETS=["./","./index.html","./style.css","./script.js","./manifest.webmanifest","./assets/rocha-digital-splash.png","./assets/rocha-digital-splash.jpg","./assets/rocha-digital-abertura.jpg","./assets/rocha-digital-logo.jpg","./assets/icon-192.png","./assets/icon-512.png"];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",event=>{if(event.request.method!=="GET")return;event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));return res}).catch(()=>cached)));});
