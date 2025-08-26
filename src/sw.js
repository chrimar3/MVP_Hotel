/**
 * Service Worker for Hotel Review Generator
 * Provides offline functionality and instant repeat visits
 */

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `hotel-review-${CACHE_VERSION}`;

// Core files to cache immediately
const CORE_CACHE = [
    '/src/app-shell.html',
    '/src/enhanced-features.js'
];

// Install event - cache core resources
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Caching core assets');
            return cache.addAll(CORE_CACHE);
        })
    );
    
    // Take control immediately
    self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name.startsWith('hotel-review-') && name !== CACHE_NAME)
                    .map((name) => {
                        console.log('Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        })
    );
    
    // Take control of all clients
    self.clients.claim();
});

// Fetch event - serve from cache when possible
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') return;
    
    // Skip cross-origin requests except CDN
    if (url.origin !== location.origin && !url.hostname.includes('cdn.jsdelivr.net')) {
        return;
    }
    
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            // Return cached version if available
            if (cachedResponse) {
                // Update cache in background for next visit
                fetchAndCache(request);
                return cachedResponse;
            }
            
            // Otherwise fetch and cache
            return fetchAndCache(request);
        })
    );
});

// Helper function to fetch and cache
async function fetchAndCache(request) {
    try {
        const response = await fetch(request);
        
        // Only cache successful responses
        if (response.ok && request.method === 'GET') {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        // If fetch fails, try to return a cached version
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // If no cache available, return offline page
        return caches.match('/src/app-shell.html');
    }
}

// Listen for messages from the client
self.addEventListener('message', (event) => {
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data.type === 'CACHE_URLS') {
        event.waitUntil(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.addAll(event.data.urls);
            })
        );
    }
});

// Background sync for offline reviews
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-reviews') {
        event.waitUntil(syncOfflineReviews());
    }
});

async function syncOfflineReviews() {
    // Get any reviews stored offline
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    
    const offlineReviews = requests.filter(req => 
        req.url.includes('/api/reviews') && req.method === 'POST'
    );
    
    for (const request of offlineReviews) {
        try {
            const response = await fetch(request);
            if (response.ok) {
                // Remove from cache after successful sync
                await cache.delete(request);
            }
        } catch (error) {
            console.log('Sync failed, will retry:', error);
        }
    }
}