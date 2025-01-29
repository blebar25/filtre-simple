const CACHE_NAME = 'filtre-simple-v1';
const BASE_PATH = '/filtre-simple';

const urlsToCache = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/app.js`,
  `${BASE_PATH}/styles.css`,
  `${BASE_PATH}/icon.png`,
  `${BASE_PATH}/manifest.json`
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache ouvert');
        return Promise.all(
          urlsToCache.map(url => 
            fetch(url, {credentials: 'same-origin'})
              .then(response => {
                if (!response.ok) {
                  throw new Error(`Failed to fetch ${url}`);
                }
                return cache.put(url, response);
              })
              .catch(error => {
                console.error(`Failed to cache ${url}:`, error);
              })
          )
        );
      })
  );
});

self.addEventListener('fetch', event => {
  // Ne pas intercepter les requêtes vers les CDN
  if (event.request.url.includes('cdn.jsdelivr.net') || 
      event.request.url.includes('storage.googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).catch(() => {
          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});
