const CACHE = 'shouub-v2';
const ASSETS = ['/', '/index.html', '/manifest.webmanifest', '/Screenshot_٢٠٢٦٠٩٢٠-٠٠٠٨٠٢_Gallery.jpg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => Promise.all(ASSETS.map((asset) => cache.add(asset).catch(() => undefined))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

self.addEventListener('push', (event) => {
  let data = { title: 'إشعار جديد', body: '' };
  try {
    if (event.data) {
      data = event.data.json();
      data = data.notification ?? data;
    }
  } catch {
    if (event.data) {
      data = { title: 'إشعار جديد', body: event.data.text() };
    }
  }

  const options = {
    body: data.body ?? '',
    icon: '/Screenshot_٢٠٢٦٠٩٢٠-٠٠٠٨٠٢_Gallery.jpg',
    badge: '/Screenshot_٢٠٢٦٠٩٢٠-٠٠٠٨٠٢_Gallery.jpg',
    dir: 'rtl',
    lang: 'ar',
  };

  event.waitUntil(self.registration.showNotification(data.title ?? 'إشعار جديد', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('/');
    })
  );
});
