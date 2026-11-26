// Офлайн-кэш GymAF. При обновлении файлов меняй номер версии.
const CACHE = 'gymaf-v13';
const PHOTOS = 'gymaf-photos';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== PHOTOS).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Фото упражнений (Free Exercise DB): один раз скачали — дальше работают без интернета
  if (url.hostname === 'raw.githubusercontent.com') {
    e.respondWith(caches.open(PHOTOS).then(c => c.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      if (res && (res.ok || res.type === 'opaque')) c.put(e.request, res.clone());
      return res;
    }))));
    return;
  }
  if (url.origin !== self.location.origin) return; // YouTube и прочее — напрямую
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(cached => {
      const net = fetch(e.request).then(res => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
        return res;
      }).catch(() => cached || caches.match('./index.html'));
      return cached || net;
    })
  );
});
