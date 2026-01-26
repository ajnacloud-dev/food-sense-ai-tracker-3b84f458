
// Dynamic cache versioning based on timestamp
const CACHE_VERSION = Date.now();
const CACHE_NAME = `nutriwealth-v${CACHE_VERSION}`;
const ASSETS_CACHE = `nutriwealth-assets-v${CACHE_VERSION}`;
const DATA_CACHE = `nutriwealth-data-v${CACHE_VERSION}`;

const urlsToCache = [
  '/',
  '/auth',
  '/dashboard',
  '/capture',
  '/caretaker',
  '/manifest.json',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/apple-touch-icon.png'
];

// Critical pages that should always be fresh
const criticalPages = ['/capture', '/dashboard', '/caretaker'];

// Install event - cache resources and skip waiting
self.addEventListener('install', (event) => {
  console.log('Service Worker installing with version:', CACHE_VERSION);
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
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches and take control
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheName.includes(`v${CACHE_VERSION}`)) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ]).then(() => {
      console.log('Service Worker activated and took control');
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_UPDATED',
            message: 'Service Worker updated successfully',
            version: CACHE_VERSION
          });
        });
      });
    })
  );
});

// Enhanced fetch event with better critical page handling
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests with network-first strategy
  if (url.pathname.includes('/api/') || url.pathname.startsWith('/v1/')) {
    event.respondWith(
      caches.open(DATA_CACHE).then(cache => {
        return fetch(request)
          .then(response => {
            // Only cache GET requests (Cache API doesn't support POST/PUT/DELETE)
            if (response.status === 200 && request.method === 'GET') {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => {
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
    
    const isForcedRefresh = url.searchParams.has('cache-bust') || 
                           request.headers.get('cache-control') === 'no-cache';
    
    event.respondWith(
      caches.open(ASSETS_CACHE).then(cache => {
        if (isForcedRefresh) {
          return fetch(request).then(fetchResponse => {
            cache.put(request, fetchResponse.clone());
            return fetchResponse;
          }).catch(() => cache.match(request));
        } else {
          return cache.match(request).then(response => {
            if (response) {
              return response;
            }
            return fetch(request).then(fetchResponse => {
              cache.put(request, fetchResponse.clone());
              return fetchResponse;
            });
          });
        }
      })
    );
    return;
  }

  // Enhanced navigation request handling with critical page support
  if (request.mode === 'navigate') {
    const isCriticalPage = criticalPages.some(page => url.pathname.startsWith(page));
    
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.status === 200) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, response.clone());
            });
          }
          return response;
        })
        .catch(() => {
          // For critical pages, try harder to serve fresh content
          if (isCriticalPage) {
            console.log('Critical page failed to load fresh, trying cache:', url.pathname);
          }
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

// Enhanced skip waiting message handler with force update support
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Received SKIP_WAITING message');
    self.skipWaiting();
  } else if (event.data && event.data.type === 'FORCE_UPDATE') {
    console.log('Received FORCE_UPDATE message - clearing all caches');
    // Clear all caches and force update
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }).then(() => {
      console.log('All caches cleared for force update');
      self.skipWaiting();
    });
  } else if (event.data && event.data.type === 'VERSION_CHECK') {
    // Send current version info back to client
    event.ports[0].postMessage({
      type: 'VERSION_RESPONSE',
      version: CACHE_VERSION,
      timestamp: Date.now()
    });
  }
});

// Enhanced update detection
self.addEventListener('updatefound', () => {
  console.log('New service worker update found');
  const newWorker = self.registration?.installing;
  
  if (newWorker) {
    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed') {
        console.log('New service worker installed, notifying clients');
        
        // Check if there's already an active service worker
        if (self.registration?.active) {
          // New update available
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({
                type: 'UPDATE_AVAILABLE',
                message: 'A new version of the app is available',
                version: CACHE_VERSION
              });
            });
          });
        }
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

// Force refresh detection with enhanced handling
self.addEventListener('fetch', (event) => {
  // Detect hard refresh (Ctrl+F5 or Cmd+Shift+R)
  if (event.request.cache === 'reload') {
    console.log('Hard refresh detected, clearing caches');
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      })
    );
  }
});

console.log('Service Worker loaded with cache version:', CACHE_VERSION);
