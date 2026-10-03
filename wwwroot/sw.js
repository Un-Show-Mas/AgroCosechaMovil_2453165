const CACHE = 'agrocosecha-v1';
const ARCHIVOS = [
  '/',
  '/index.html',
  '/css/estilos.css',
  '/js/app.js',
  '/manifest.json',
  '/img/icono.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ARCHIVOS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(claves =>
      Promise.all(claves.filter(clave => clave !== CACHE).map(clave => caches.delete(clave)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Nunca guardar en cache las respuestas de la API.
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(respuesta => respuesta || fetch(event.request))
  );
});
