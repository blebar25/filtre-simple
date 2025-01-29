const CACHE_NAME = 'filtre-simple-v1';
const urlsToCache = [
  '.',
  'index.html',
  'app.js',
  'styles.css',
  'icon.png',
  'manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache ouvert');
        return cache.addAll(urlsToCache.map(url => new Request(url, {credentials: 'same-origin'})));
      })
      .catch(error => {
        console.error('Erreur lors de la mise en cache:', error);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).catch(error => {
          console.error('Erreur lors de la récupération:', error);
          return new Response('Erreur de connexion', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});
