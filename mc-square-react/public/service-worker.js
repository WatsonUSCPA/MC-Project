/* MC Square Service Worker
 * - ページ遷移: ネットワーク優先、オフライン時はキャッシュ済みのアプリ or offline.html
 * - /static/ (ハッシュ付きビルド成果物): キャッシュ優先
 * - 画像・フォント: stale-while-revalidate
 * - API / Stripe / Firebase などの動的リクエストはキャッシュしない
 */
const VERSION = 'v1';
const PRECACHE = `mc-precache-${VERSION}`;
const RUNTIME = `mc-runtime-${VERSION}`;
const PRECACHE_URLS = ['/', '/index.html', '/offline.html', '/manifest.json', '/logo192.png', '/logo512.png'];
const RUNTIME_MAX_ENTRIES = 150;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PRECACHE).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== PRECACHE && key !== RUNTIME).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

const isNoCachePath = (url) =>
  url.pathname.startsWith('/api/') ||
  url.pathname.startsWith('/.netlify/') ||
  url.pathname === '/service-worker.js' ||
  (url.pathname.endsWith('.html') && url.pathname !== '/index.html' && url.pathname !== '/offline.html');

// 同一オリジンの画像・フォントと Google Fonts のみ（Firebase Storage 等の外部画像は容量節約のため対象外）
const isCacheableAsset = (url) =>
  (url.origin === self.location.origin && /\.(?:png|jpe?g|gif|webp|svg|ico|woff2?|ttf)$/i.test(url.pathname)) ||
  url.origin === 'https://fonts.googleapis.com' ||
  url.origin === 'https://fonts.gstatic.com';

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - maxEntries; i++) {
    await cache.delete(keys[i]);
  }
}

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(PRECACHE);
      cache.put('/index.html', response.clone());
    }
    return response;
  } catch (err) {
    return (await caches.match('/index.html')) || (await caches.match('/offline.html'));
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(RUNTIME);
    cache.put(request, response.clone());
    trimCache(RUNTIME, RUNTIME_MAX_ENTRIES);
  }
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok || response.type === 'opaque') {
        cache.put(request, response.clone());
        trimCache(RUNTIME, RUNTIME_MAX_ENTRIES);
      }
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 同一オリジンのページ遷移（SPA）
  if (request.mode === 'navigate' && url.origin === self.location.origin) {
    if (isNoCachePath(url)) return;
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (url.origin === self.location.origin) {
    if (isNoCachePath(url)) return;
    if (url.pathname.startsWith('/static/')) {
      event.respondWith(cacheFirst(request));
      return;
    }
  }

  if (isCacheableAsset(url)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
