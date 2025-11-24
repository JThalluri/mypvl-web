// Service Worker for PWA Wrapper
const CACHE_NAME = 'pwa-wrapper-v2';
const APP_SHELL_CACHE = 'app-shell-v2';

// Resources to cache immediately
const APP_SHELL_RESOURCES = [
    '/wrapper.html',
    '/manifest.json',
    '/css/main.css',
    '/resources/play-solid-full.svg',
    '/resources/banner.png'
];

// Resources to cache on demand
const DYNAMIC_CACHE = 'dynamic-content-v1';

self.addEventListener('install', (event) => {
    console.log('PWA: Service Worker installing');
    
    event.waitUntil(
        caches.open(APP_SHELL_CACHE)
            .then((cache) => {
                console.log('PWA: Caching app shell');
                return cache.addAll(APP_SHELL_RESOURCES);
            })
            .then(() => {
                return self.skipWaiting();
            })
    );
});

self.addEventListener('activate', (event) => {
    console.log('PWA: Service Worker activating');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== APP_SHELL_CACHE && cacheName !== DYNAMIC_CACHE) {
                        console.log('PWA: Deleting old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Only handle same-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                return response || fetch(event.request)
                    .then((fetchResponse) => {
                        // Cache successful requests to dynamic cache
                        if (fetchResponse && fetchResponse.status === 200) {
                            const responseToCache = fetchResponse.clone();
                            caches.open(DYNAMIC_CACHE)
                                .then((cache) => {
                                    cache.put(event.request, responseToCache);
                                });
                        }
                        return fetchResponse;
                    })
                    .catch(() => {
                        // If both cache and network fail, show offline page
                        if (event.request.destination === 'document') {
                            return caches.match('/wrapper.html');
                        }
                    });
            })
    );
});

// Background sync for future offline functionality
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        console.log('PWA: Background sync triggered');
        // Future: Sync user actions when back online
    }
});