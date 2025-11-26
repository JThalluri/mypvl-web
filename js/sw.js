// Service Worker for PWA Wrapper - v3.1.0
const CACHE_VERSION = 'v3.1.0';
const CACHE_NAME = `pwa-wrapper-${CACHE_VERSION}`;
const APP_SHELL_CACHE = `app-shell-${CACHE_VERSION}`;

// Resources to cache immediately
const APP_SHELL_RESOURCES = [
    '/wrapper.html',
    '/manifest.json',
    '/icons/app-logo.png',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// JS files that should always be fetched fresh
const ALWAYS_NETWORK = [
    '/js/wrapper.js',
    '/js/library-search.js', 
    '/js/ui-extractor.js',
    '/js/style-injector.js',
    '/css/pwa-injected-styles.css'
];

self.addEventListener('install', (event) => {
    console.log(`PWA: Service Worker installing ${CACHE_VERSION}`);
    
    event.waitUntil(
        caches.open(APP_SHELL_CACHE)
            .then((cache) => {
                console.log('PWA: Caching app shell resources');
                return cache.addAll(APP_SHELL_RESOURCES);
            })
            .then(() => {
                console.log('PWA: Installation complete, skipping wait');
                return self.skipWaiting(); // Activate immediately
            })
            .catch((error) => {
                console.error('PWA: Installation failed', error);
            })
    );
});

self.addEventListener('activate', (event) => {
    console.log(`PWA: Service Worker activating ${CACHE_VERSION}`);
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Delete any cache that doesn't match current version
                    if (!cacheName.includes(CACHE_VERSION)) {
                        console.log('PWA: Deleting old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('PWA: Activation complete, claiming clients');
            return self.clients.claim(); // Control all clients immediately
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Only handle same-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }
    
    const url = new URL(event.request.url);
    
    // Always fetch JS/CSS files from network first (cache busting)
    if (ALWAYS_NETWORK.some(resource => url.pathname.endsWith(resource))) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Cache the fresh version for offline use
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    return response;
                })
                .catch(() => {
                    // If network fails, try cache
                    return caches.match(event.request);
                })
        );
        return;
    }
    
    // For HTML files, use network-first strategy
    if (url.pathname.endsWith('.html')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Cache fresh HTML
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    return response;
                })
                .catch(() => {
                    return caches.match(event.request);
                })
        );
        return;
    }
    
    // Default: cache-first for other resources
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                if (response) {
                    return response;
                }
                
                return fetch(event.request)
                    .then((response) => {
                        // Cache the new resource
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseClone);
                            });
                        return response;
                    });
            })
    );
});

// Listen for messages from the client to force cache clearing
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => caches.delete(cacheName))
            );
        }).then(() => {
            event.ports[0].postMessage({ success: true });
        });
    }
});