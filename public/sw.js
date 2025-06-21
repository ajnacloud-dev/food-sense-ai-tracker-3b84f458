
const CACHE_NAME = 'nutriwealth-v2.0.0';
const ASSETS_CACHE = 'nutriwealth-assets-v2.0.0';
const DATA_CACHE = 'nutriwealth-data-v2.0.0';

const urlsToCache = [
  '/',
  '/auth',
  '/dashboard',
  '/manifest.json',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/apple-touch-icon.png'
];

// Install event - cache resources and skip waiting
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME)
        .then((cache) => {
          console.log('Caching core files');
          return cache.addAll(urlsToCache);
        }),
      caches.open(ASSETS_CACHE)
        .then((cache) => {
          console.log('Assets cache created');
          return cache;
        })
    ]).then(() => {
      console.log('Service Worker installed successfully');
      // Force the waiting service worker to become the active service worker
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches and take control
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== ASSETS_CACHE && 
                cacheName !== DATA_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ]).then(() => {
      console.log('Service Worker activated and took control');
      // Notify all clients about the update
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_UPDATED',
            message: 'Service Worker updated successfully'
          });
        });
      });
    })
  );
});

// Fetch event - implement cache strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests with network-first strategy
  if (url.pathname.includes('/api/') || url.hostname.includes('supabase')) {
    event.respondWith(
      caches.open(DATA_CACHE).then(cache => {
        return fetch(request)
          .then(response => {
            // Only cache successful responses
            if (response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => {
            // Return cached version if network fails
            return cache.match(request);
          });
      })
    );
    return;
  }

  // Handle static assets with cache-first strategy
  if (request.destination === 'image' || 
      request.destination === 'script' || 
      request.destination === 'style') {
    event.respondWith(
      caches.open(ASSETS_CACHE).then(cache => {
        return cache.match(request).then(response => {
          if (response) {
            return response;
          }
          return fetch(request).then(fetchResponse => {
            cache.put(request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      })
    );
    return;
  }

  // Handle navigation requests with network-first, fallback to cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful navigation responses
          if (response.status === 200) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, response.clone());
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cached version
          return caches.match(request).then(response => {
            return response || caches.match('/');
          });
        })
    );
    return;
  }

  // Default strategy for other requests
  event.respondWith(
    caches.match(request).then(response => {
      return response || fetch(request);
    })
  );
});

// Listen for skip waiting message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Received SKIP_WAITING message');
    self.skipWaiting();
  }
});

// Notify clients when new service worker is ready to take over
self.addEventListener('updatefound', () => {
  console.log('New service worker update found');
  const newWorker = self.registration.installing;
  
  if (newWorker) {
    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && self.registration.active) {
        console.log('New service worker installed, notifying clients');
        // New update available
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'UPDATE_AVAILABLE',
              message: 'A new version of the app is available'
            });
          });
        });
      }
    });
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Background sync triggered');
    event.waitUntil(
      // Handle any offline actions that need to be synced
      Promise.resolve()
    );
  }
});

// Push notification handler
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey || '1'
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});
