// Painel de Viagem - cache offline
const CACHE = 'painel-moto-v7';

const ARQUIVOS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ARQUIVOS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(nomes => Promise.all(
        nomes.filter(n => n !== CACHE).map(n => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;

  if (req.method !== 'GET') return;

  // clima sempre da rede; sem sinal, o app usa o último valor salvo
  if (req.url.includes('api.open-meteo.com')) return;

  event.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        // guarda fontes e demais recursos para funcionar offline depois
        if (res && res.status === 200 && (res.type === 'basic' || res.type === 'cors')) {
          const copia = res.clone();
          caches.open(CACHE).then(cache => cache.put(req, copia));
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
