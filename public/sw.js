/**
 * SWEETO Hub Service Worker for Background Push Notifications & Offline Support
 * Handles dynamic push events and provides PWA asset caching capabilities.
 */

const CACHE_NAME = 'sweeto-cache-v1';
const OFFLINE_URL = '/';

// Core assets to cache immediately upon installation
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/admin-favicon.svg',
  '/admin-manifest.json',
  '/admin-icon-192.png',
  '/admin-icon-512.png',
  '/admin-apple-touch-icon.png',
  '/icons.svg',
  '/hero-banner.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        PRECACHE_ASSETS.map((asset) => {
          return cache.add(asset).catch((err) => {
            console.warn(`Failed to precache asset: ${asset}`, err);
          });
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Only intercept standard HTTP/HTTPS requests (ignores chrome-extension, data, blob, etc.)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Avoid intercepting API database calls or Supabase requests so backend operations work normally
  if (url.pathname.includes('/api/') || url.host.includes('supabase.co')) {
    return;
  }

  // Network-First with Cache Fallback for navigation requests (HTML pages)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            // Open cache and save the fresh version
            const clone = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => cache.put(event.request, clone).catch(() => {}))
              .catch(() => {});
          }
          return response;
        })
        .catch(() => {
          // Offline fallback
          return caches.match(OFFLINE_URL) || caches.match('/index.html');
        })
    );
    return;
  }

  // Cache-First strategy for images (to avoid saturating browser network sockets in the background)
  const isImageRequest = 
    url.pathname.match(/\.(png|jpg|jpeg|webp|svg|gif|ico)$/i) || 
    url.pathname.includes('/storage/v1/object/public/');

  if (isImageRequest) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => cache.put(event.request, clone).catch(() => {}))
                .catch(() => {});
            }
            return networkResponse;
          })
          .catch(() => {
            // Ignore offline image errors
          });
      })
    );
    return;
  }

  // Stale-While-Revalidate for other static assets (JS, CSS, fonts)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => cache.put(event.request, clone).catch(() => {}))
              .catch(() => {});
          }
          return networkResponse;
        })
        .catch(() => {
          // Ignore network errors, just rely on cache
        });

      return cachedResponse || fetchPromise;
    })
  );
});

self.addEventListener('push', (event) => {
  console.log('Background push notification received.');
  
  let data = { 
    title: 'SWEETO HUB', 
    body: 'New arrival or special deal available now!', 
    url: '/#/' 
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { 
        title: 'SWEETO HUB', 
        body: event.data.text(), 
        url: '/#/' 
      };
    }
  }

  const origin = self.location.origin;
  const options = {
    body: data.body,
    icon: origin + '/favicon.svg',
    badge: origin + '/favicon.svg',
    image: data.image ? (data.image.startsWith('http') ? data.image : origin + data.image) : null,
    data: { url: data.url },
    vibrate: [200, 100, 200],
    requireInteraction: true,
    actions: [
      { action: 'explore', title: 'VIEW NOW' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const targetUrl = event.notification.data?.url || '/#/';
  
  // Resolve client window focus or open new one
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a tab is already open with the root domain, navigate it and focus
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if ('focus' in client) {
          // If the app is active, route or load the product hash
          client.postMessage({ type: 'ROUTE_TO', url: targetUrl });
          return client.focus().then(() => {
            if (client.navigate) {
              return client.navigate(targetUrl);
            }
          });
        }
      }
      // If no tab is open, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
