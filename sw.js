const CACHE_NAME = 'soulart-temple-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/landing.html',
  '/home.html',
  '/temple.html',
  '/members-dashboard.html',
  '/login.html',
  '/register.html',
  '/membership.html',
  '/profile.html',
  '/styles/style.css',
  '/styles/legal.css',
  '/styles/chakra-tokens.css',
  '/styles/members-dashboard.css',
  '/styles/temple-hallway.css',
  '/styles/home.css',
  '/manifest.json',
  '/SoulArt%20Brand%20full.png',
  '/attached_assets/generated_images/enchanted_temple_path_twilight.jpg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(ASSETS_TO_CACHE).catch(err => {
          console.log('Some assets failed to cache:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        const fetchPromise = fetch(event.request)
          .then(response => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, clone));
            }
            return response;
          })
          .catch(() => cached);
        
        return cached || fetchPromise;
      })
  );
});
