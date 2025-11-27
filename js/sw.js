// Enhanced Service Worker for PWA Wrapper - v3.2.0
const CACHE_VERSION = 'v3.2.0';
const CACHE_NAMES = {
    appShell: `app-shell-${CACHE_VERSION}`,
    dynamic: `dynamic-content-${CACHE_VERSION}`,
    library: `library-content-${CACHE_VERSION}`
};

// Resources to cache immediately on install
const APP_SHELL_RESOURCES = [
    '/wrapper.html',
    '/manifest.json',
    '/icons/app-logo.png',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Files that should always be fetched fresh (network-first)
const NETWORK_FIRST_RESOURCES = [
    '/js/wrapper.js',
    '/js/library-search.js', 
    '/js/ui-extractor.js',
    '/js/style-injector.js',
    '/css/pwa-injected-styles.css',
    '/library/library_metadata.json'
];

self.addEventListener('install', (event) => {
    console.log(`PWA: Service Worker installing ${CACHE_VERSION}`);
    
    event.waitUntil(
        caches.open(CACHE_NAMES.appShell)
            .then((cache) => {
                console.log('PWA: Caching app shell resources');
                return cache.addAll(APP_SHELL_RESOURCES);
            })
            .then(() => {
                console.log('PWA: Installation complete, skipping wait');
                return self.skipWaiting();
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
                    if (!Object.values(CACHE_NAMES).includes(cacheName)) {
                        console.log('PWA: Deleting old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('PWA: Activation complete, claiming clients');
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Only handle same-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }
    
    const url = new URL(event.request.url);
    const request = event.request;
    
    // Strategy 1: Network-first for critical app files (always fresh)
    if (isNetworkFirstResource(url)) {
        event.respondWith(networkFirstStrategy(request, CACHE_NAMES.dynamic));
        return;
    }
    
    // Strategy 2: Stale-while-revalidate for library content (dynamic detection)
    if (isLibraryContent(url)) {
        event.respondWith(staleWhileRevalidateStrategy(request, CACHE_NAMES.library));
        return;
    }
    
    // Strategy 3: Network-first for HTML files
    if (url.pathname.endsWith('.html')) {
        event.respondWith(networkFirstStrategy(request, CACHE_NAMES.dynamic));
        return;
    }
    
    // Strategy 4: Cache-first for other static resources
    event.respondWith(cacheFirstStrategy(request, CACHE_NAMES.dynamic));
});

// Caching Strategies
async function networkFirstStrategy(request, cacheName) {
    try {
        const networkResponse = await fetch(request);
        
        // Only cache successful responses
        if (networkResponse.status === 200) {
            const cache = await caches.open(cacheName);
            await cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        // Network failed - try cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // If wrapper.html fails, serve offline page
        if (request.url.includes('wrapper.html')) {
            return caches.match('/offline.html');
        }
        
        throw error;
    }
}

async function cacheFirstStrategy(request, cacheName) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        // Update cache in background without blocking response
        updateCacheInBackground(request, cacheName);
        return cachedResponse;
    }
    
    // Not in cache - fetch and cache
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.status === 200) {
            const cache = await caches.open(cacheName);
            await cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        throw error;
    }
}

async function staleWhileRevalidateStrategy(request, cacheName) {
    // First, try to return cached version immediately
    const cachedResponse = await caches.match(request);
    
    // Always update cache in background for library content
    const networkPromise = fetch(request)
        .then(async (networkResponse) => {
            // Only cache successful responses (avoid caching errors)
            if (networkResponse.status === 200) {
                const cache = await caches.open(cacheName);
                await cache.put(request, networkResponse.clone());
            }
            return networkResponse;
        })
        .catch(() => null); // Ignore network errors for background update
    
    // Return cached response immediately, or wait for network if no cache
    return cachedResponse || networkPromise;
}

// Dynamic Library Detection - No hardcoded paths
function isLibraryContent(url) {
    const path = url.pathname;
    
    // Pattern 1: Direct library paths like /QKNK9F/index.html
    if (path.match(/^\/[A-Z0-9]{6}\/index\.html$/)) {
        return true;
    }
    
    // Pattern 2: Nested library paths like /QKNK9F/BT9R66/index.html  
    if (path.match(/^\/[A-Z0-9]{6}\/[A-Z0-9]{6}\/index\.html$/)) {
        return true;
    }
    
    // Pattern 3: Library assets in library directories
    if (path.match(/^\/[A-Z0-9]{6}\//) && 
        (path.includes('.css') || path.includes('.js') || path.includes('.png') || path.includes('.jpg'))) {
        return true;
    }
    
    return false;
}

function isNetworkFirstResource(url) {
    return NETWORK_FIRST_RESOURCES.some(resource => 
        url.pathname.endsWith(resource)
    );
}

async function updateCacheInBackground(request, cacheName) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.status === 200) {
            const cache = await caches.open(cacheName);
            await cache.put(request, networkResponse);
        }
    } catch (error) {
        // Silent fail - background update shouldn't affect user
    }
}

// Enhanced message handling for cache management
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        clearAllCaches().then(() => {
            event.ports?.[0]?.postMessage({ success: true });
        });
    }
    
    if (event.data && event.data.type === 'CLEAR_LIBRARY_CACHE') {
        clearLibraryCache().then(() => {
            event.ports?.[0]?.postMessage({ success: true });
        });
    }
});

async function clearAllCaches() {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
    console.log('PWA: All caches cleared');
}

async function clearLibraryCache() {
    const cache = await caches.open(CACHE_NAMES.library);
    const requests = await cache.keys();
    
    await Promise.all(requests.map(request => cache.delete(request)));
    console.log('PWA: Library cache cleared');
}