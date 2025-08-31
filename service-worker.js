/**
 * Service Worker for Hotel Review Generator
 * Provides offline functionality and caching strategy
 */

const CACHE_NAME = 'hotel-review-v2.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/review-generator.html',
  '/manifest.json',
  '/favicon.ico',
  '/src/services/HybridGenerator.js',
  '/src/services/LLMReviewGenerator.js',
  '/src/services/analytics-free.js',
  '/src/services/error-tracking.js',
  '/src/services/PerformanceMonitor.js',
  '/src/utils/security.js'
];

// Install event - cache essential files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Caching app shell');
        return cache.addAll(urlsToCache.map(url => {
          // Adjust URLs for GitHub Pages deployment
          const baseUrl = self.location.pathname.includes('MVP_Hotel') 
            ? '/MVP_Hotel' 
            : '';
          return baseUrl + url;
        }));
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName.startsWith('hotel-review-')) {
            console.log('[ServiceWorker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip external API requests
  const url = new URL(event.request.url);
  if (!url.origin.includes(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          console.log('[ServiceWorker] Serving from cache:', event.request.url);
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache the fetched response for future use
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // Offline fallback
        console.log('[ServiceWorker] Offline - serving fallback');
        
        // Return offline page for navigation requests
        if (event.request.destination === 'document') {
          return caches.match('/index.html').then(response => {
            if (response) return response;
            
            // Ultimate fallback - inline HTML
            return new Response(`
              <!DOCTYPE html>
              <html lang="en">
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Offline - Hotel Review Generator</title>
                <style>
                  body {
                    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  }
                  .offline-message {
                    background: white;
                    padding: 40px;
                    border-radius: 20px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    text-align: center;
                    max-width: 400px;
                  }
                  h1 { color: #1e40af; margin-bottom: 20px; }
                  p { color: #6b7280; line-height: 1.6; }
                  button {
                    background: #3b82f6;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-size: 16px;
                    cursor: pointer;
                    margin-top: 20px;
                  }
                  button:hover { background: #2563eb; }
                </style>
              </head>
              <body>
                <div class="offline-message">
                  <h1>📵 You're Offline</h1>
                  <p>The Hotel Review Generator requires an internet connection to work properly.</p>
                  <p>Please check your connection and try again.</p>
                  <button onclick="window.location.reload()">Retry</button>
                </div>
              </body>
              </html>
            `, {
              headers: { 'Content-Type': 'text/html' }
            });
          });
        }
      })
  );
});

// Background sync for failed review submissions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-reviews') {
    event.waitUntil(syncPendingReviews());
  }
});

async function syncPendingReviews() {
  try {
    // Get pending reviews from IndexedDB (if implemented)
    console.log('[ServiceWorker] Syncing pending reviews...');
    // Implementation would go here
    return Promise.resolve();
  } catch (error) {
    console.error('[ServiceWorker] Sync failed:', error);
    return Promise.reject(error);
  }
}

// Push notifications (if needed in future)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'New review features available!',
    icon: '/MVP_Hotel/favicon.ico',
    badge: '/MVP_Hotel/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('Hotel Review Generator', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});