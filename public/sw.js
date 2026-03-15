// VIVO — Service Worker v1.0
// Handles caching and push notifications

const CACHE_NAME = 'vivo-cache-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.svg',
];

// Install — cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// Fetch — network first, fallback to cache
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests and API calls
    if (event.request.method !== 'GET') return;
    if (event.request.url.includes('googleapis.com')) return;
    if (event.request.url.includes('firestore')) return;
    if (event.request.url.includes('intervals.icu')) return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Cache valid responses
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});

// Push notification handler
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || '🏋️ VIVO — Check-in matutino';
    const options = {
        body: data.body || '¡Buenos días! Registra tus síntomas y electrolitos del día.',
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: 'vivo-daily-checkin',
        renotify: true,
        actions: [
            { action: 'open', title: 'Abrir VIVO' },
            { action: 'dismiss', title: 'Luego' },
        ],
        data: { url: '/' },
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'dismiss') return;

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
            // Focus existing window if available
            for (const client of clients) {
                if (client.url.includes('/') && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise open new window
            return self.clients.openWindow('/');
        })
    );
});
