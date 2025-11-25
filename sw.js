// Service Worker for PWA Wrapper - v3
const CACHE_NAME = 'pwa-wrapper-v3';
const APP_SHELL_CACHE = 'app-shell-v3';

// Resources to cache immediately
const APP_SHELL_RESOURCES = [
    '/wrapper.html',
    '/manifest.json',
    '/icons/app-logo.png',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

self.addEventListener('install', (event) => {
    console.log('PWA: Service Worker installing v3');
    
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
    console.log('PWA: Service Worker activating v3');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== APP_SHELL_CACHE) {
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
                return response || fetch(event.request);
            })
    );
});