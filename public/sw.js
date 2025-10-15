// =========================================
// NEEKIHUB - SERVICE WORKER
// Offline-First PWA Implementation
// =========================================

const CACHE_NAME = 'neekihub-v1.0.0';
const RUNTIME_CACHE = 'neekihub-runtime-v1.0.0';

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/main.js',
    '/modules/quran-learning.js',
    '/modules/duas.js',
    '/modules/prayer-times.js',
    '/modules/qibla-finder.js',
    '/modules/ai-assistant.js',
    '/manifest.json',
    'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Amiri:wght@400;700&family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css'
];

// Install Event - Cache static assets
self.addEventListener('install', (event) => {
    console.log('✅ Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Service Worker: Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
    console.log('🔄 Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
                    .map((name) => {
                        console.log('🗑️ Service Worker: Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event - Network First, Cache Fallback for API, Cache First for Assets
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // API Requests - Network First, Cache Fallback
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Clone and cache the response
                    const responseClone = response.clone();
                    caches.open(RUNTIME_CACHE).then((cache) => {
                        cache.put(request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    // If network fails, try cache
                    return caches.match(request).then((cached) => {
                        if (cached) {
                            return cached;
                        }
                        // Return offline fallback for API
                        return new Response(
                            JSON.stringify({ 
                                success: false, 
                                message: 'Offline - cached data not available' 
                            }),
                            { 
                                headers: { 'Content-Type': 'application/json' } 
                            }
                        );
                    });
                })
        );
        return;
    }
    
    // Static Assets - Cache First, Network Fallback
    event.respondWith(
        caches.match(request)
            .then((cached) => {
                if (cached) {
                    return cached;
                }
                
                return fetch(request)
                    .then((response) => {
                        // Don't cache non-successful responses
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseClone);
                        });
                        
                        return response;
                    });
            })
            .catch(() => {
                // Offline fallback page
                if (request.mode === 'navigate') {
                    return caches.match('/index.html');
                }
            })
    );
});

// Background Sync for Prayer Times
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-prayer-times') {
        event.waitUntil(syncPrayerTimes());
    }
});

async function syncPrayerTimes() {
    try {
        const response = await fetch('/api/prayer-times');
        const data = await response.json();
        
        // Cache the updated data
        const cache = await caches.open(RUNTIME_CACHE);
        await cache.put('/api/prayer-times', new Response(JSON.stringify(data)));
        
        console.log('✅ Prayer times synced');
    } catch (error) {
        console.error('❌ Prayer times sync failed:', error);
    }
}

// Push Notifications (for future prayer reminders)
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    
    const title = data.title || 'Neekihub';
    const options = {
        body: data.body || 'New notification from Neekihub',
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        tag: data.tag || 'neekihub-notification',
        data: {
            url: data.url || '/'
        },
        actions: [
            { action: 'open', title: 'Open' },
            { action: 'close', title: 'Close' }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'open' || !event.action) {
        event.waitUntil(
            clients.openWindow(event.notification.data.url || '/')
        );
    }
});

// Message Handler (for client communication)
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_URLS') {
        event.waitUntil(
            caches.open(RUNTIME_CACHE)
                .then((cache) => cache.addAll(event.data.urls))
        );
    }
});

console.log('🕌 Neekihub Service Worker Loaded');