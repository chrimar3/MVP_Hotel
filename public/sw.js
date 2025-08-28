/**
 * Service Worker for Hotel Review Generator PWA
 * Handles offline functionality, caching, and background sync
 */

const CACHE_NAME = 'hotel-review-v1';
const STATIC_ASSETS = [
    '/',
    '/src/ultimate-hotel-review-generator.html',
    '/manifest.json'
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(name => name !== CACHE_NAME)
                        .map(name => caches.delete(name))
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Skip analytics requests
    if (event.request.url.includes('google-analytics.com')) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                // Return cached response if found
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                // Otherwise fetch from network
                return fetch(event.request)
                    .then(response => {
                        // Don't cache non-successful responses
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Clone the response for caching
                        const responseToCache = response.clone();
                        
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch(() => {
                        // Return offline fallback for HTML requests
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return caches.match('/src/ultimate-hotel-review-generator.html');
                        }
                    });
            })
    );
});

// Background sync for analytics
self.addEventListener('sync', (event) => {
    if (event.tag === 'analytics-sync') {
        event.waitUntil(syncAnalytics());
    }
});

async function syncAnalytics() {
    try {
        // Get pending analytics from IndexedDB or localStorage
        const pendingEvents = await getPendingAnalytics();
        
        if (pendingEvents.length > 0) {
            // Send to analytics endpoint
            await fetch('/api/analytics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pendingEvents)
            });
            
            // Clear pending events
            await clearPendingAnalytics();
        }
    } catch (error) {
        console.error('Analytics sync failed:', error);
    }
}

// Helper functions for analytics persistence
async function getPendingAnalytics() {
    // Implementation would use IndexedDB
    return [];
}

async function clearPendingAnalytics() {
    // Implementation would clear IndexedDB
    return true;
}

// Handle messages from the app
self.addEventListener('message', (event) => {
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data.type === 'CACHE_URLS') {
        event.waitUntil(
            caches.open(CACHE_NAME)
                .then(cache => cache.addAll(event.data.urls))
        );
    }
});

// Push notifications (for future review reminders)
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'Time to share your hotel experience!',
        icon: '/assets/icon-192.png',
        badge: '/assets/badge-72.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'write-review',
                title: 'Write Review',
                icon: '/assets/review-icon.png'
            },
            {
                action: 'dismiss',
                title: 'Later',
                icon: '/assets/close-icon.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Hotel Review Reminder', options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'write-review') {
        event.waitUntil(
            clients.openWindow('/src/ultimate-hotel-review-generator.html')
        );
    }
});

console.log('Service Worker loaded successfully');