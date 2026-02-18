const CACHE_NAME = 'frigo-smart-v4.8';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/freezy-video.webm',
  '/favicon.ico'
];

// Install: pre-cache e attivazione immediata
self.addEventListener('install', event => {
  console.log('🔧 Service Worker: Installazione in corso...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Cache aperta, aggiunta file...');
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => {
        console.log('✅ File cached con successo');
        return self.skipWaiting(); // ATTIVA SUBITO IL NUOVO SW
      })
  );
});

// Activate: pulizia cache vecchie e claim immediato
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker: Attivazione...');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Cancello cache vecchia:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Cache pulita, prendo controllo pagine');
        return self.clients.claim(); // PRENDI CONTROLLO SUBITO
      })
  );
});

// Fetch: network-first per l'HTML, cache-first per il resto
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Network-first per index.html (sempre fresco)
  if (url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clonedResponse);
          });
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
  
  // Cache-first per tutto il resto
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(event.request).then(response => {
          // Copia la risposta
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        });
      })
  );
});

// Notifica ai client quando c'è un nuovo SW in attesa
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});

