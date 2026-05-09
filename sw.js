// Service Worker - Daily Photographer Sales
const CACHE_NAME = 'dps-cache-v1';
const URLS_TO_CACHE = [
  '/sales-Photographer/',
  '/sales-Photographer/index.html'
];

// تثبيت
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// تفعيل وحذف الكاش القديم
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// الطلبات - Network First ثم Cache
self.addEventListener('fetch', event => {
  // تجاهل طلبات Google Sheets (تحتاج إنترنت دائماً)
  if (event.request.url.includes('script.google.com')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // احفظ نسخة في الكاش
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, clone);
        });
        return response;
      })
      .catch(() => {
        // إذا لا إنترنت — خذ من الكاش
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // إذا الصفحة الرئيسية
          return caches.match('/sales-Photographer/index.html');
        });
      })
  );
});
