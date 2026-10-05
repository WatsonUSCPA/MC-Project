/* MC Square Service Worker
 * - ページ遷移: ネットワーク優先。レスポンス自体は保存しない（レシピ詳細はエッジ関数でページごとの HTML になるため）。
 *   オフライン時は、トップページ（/）から取ったアプリの土台 HTML を表示し、それもなければ offline.html
 * - /static/ (ハッシュ付きビルド成果物): asset-manifest.json をもとに JS/CSS をまとめて保存し、キャッシュ優先で返す
 * - 同一オリジンの画像・フォントと Google Fonts: stale-while-revalidate（no-cors の opaque レスポンスは保存しない）
 * - API / Netlify Functions / Stripe / Firebase などの動的リクエストはキャッシュしない
 *
 * このファイルの中身を変えたら、必ず VERSION を上げること（古いキャッシュが消え、新しい SW に切り替わる）。
 * PWA をやめるときは、このファイルを消すのではなく mc-square-react/pwa-killswitch/service-worker.js で置き換える。
 */
const VERSION = 'v2';
const SHELL_CACHE = `mc-shell-${VERSION}`;
const STATIC_CACHE = `mc-static-${VERSION}`;
const RUNTIME_CACHE = `mc-runtime-${VERSION}`;
const SHELL_URL = '/';
const OFFLINE_URL = '/offline.html';
const SHELL_EXTRAS = [OFFLINE_URL, '/manifest.json', '/logo192.png', '/logo512.png'];
const RUNTIME_MAX_ENTRIES = 150;
const SHELL_REFRESH_INTERVAL_MS = 10 * 60 * 1000;
const FONT_ORIGINS = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'];

let lastShellRefresh = 0;

// トップページの HTML をアプリの土台として保存する（リダイレクトされたレスポンスは遷移に使えないので保存しない）
async function storeShell(response) {
  if (!response.ok || response.redirected) return false;
  const cache = await caches.open(SHELL_CACHE);
  await cache.put(SHELL_URL, response);
  return true;
}

// 今のビルドの JS/CSS をすべて保存し、古いビルドのものは削除する
// → まだ開いていないページのチャンクもオフラインで読み込める
async function syncStaticAssets() {
  const response = await fetch('/asset-manifest.json', { cache: 'no-store' });
  if (!response.ok) return;
  const manifest = await response.json();
  const urls = Object.values(manifest.files || {})
    .filter((path) => typeof path === 'string' && path.startsWith('/static/') && !path.endsWith('.map'));
  const wanted = new Set(urls.map((path) => new URL(path, self.location.origin).href));

  const cache = await caches.open(STATIC_CACHE);
  const cachedRequests = await cache.keys();
  const cachedUrls = new Set(cachedRequests.map((request) => request.url));

  await Promise.all(urls
    .filter((path) => !cachedUrls.has(new URL(path, self.location.origin).href))
    .map((path) => cache.add(path).catch(() => undefined)));
  await Promise.all(cachedRequests
    .filter((request) => !wanted.has(request.url))
    .map((request) => cache.delete(request)));
}

// デプロイで土台 HTML が変わっていたら、保存し直して JS/CSS もそろえる（数分に一度まで）
async function refreshShell() {
  const now = Date.now();
  if (now - lastShellRefresh < SHELL_REFRESH_INTERVAL_MS) return;
  lastShellRefresh = now;
  try {
    const response = await fetch(SHELL_URL, { cache: 'no-cache' });
    if (!response.ok || response.redirected) return;
    const cached = await caches.match(SHELL_URL, { cacheName: SHELL_CACHE });
    const [fresh, old] = await Promise.all([
      response.clone().text(),
      cached ? cached.text() : Promise.resolve(null),
    ]);
    if (fresh === old) return;
    await storeShell(response);
    await syncStaticAssets();
  } catch (err) {
    // オフラインなどで失敗しても、次の遷移で再挑戦する
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const shellCache = await caches.open(SHELL_CACHE);
    await shellCache.addAll(SHELL_EXTRAS);
    await storeShell(await fetch(SHELL_URL, { cache: 'no-cache' }));
    await syncStaticAssets();
    lastShellRefresh = Date.now();
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  const current = [SHELL_CACHE, STATIC_CACHE, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key.startsWith('mc-') && !current.includes(key)).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

const isNoCachePath = (url) =>
  url.pathname.startsWith('/api/') ||
  url.pathname.startsWith('/.netlify/') ||
  url.pathname === '/service-worker.js' ||
  url.pathname === '/asset-manifest.json' ||
  (url.pathname.endsWith('.html') && url.pathname !== OFFLINE_URL);

// 同一オリジンの画像・フォントと Google Fonts のみ（Firebase Storage 等の外部画像は容量節約のため対象外）
const isCacheableAsset = (url) =>
  (url.origin === self.location.origin && /\.(?:png|jpe?g|gif|webp|svg|ico|woff2?|ttf)$/i.test(url.pathname)) ||
  FONT_ORIGINS.includes(url.origin);

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - maxEntries; i++) {
    await cache.delete(keys[i]);
  }
}

async function handleNavigation(event) {
  const url = new URL(event.request.url);
  try {
    const response = await fetch(event.request);
    if (url.pathname === SHELL_URL) {
      if (response.ok && !response.redirected) {
        lastShellRefresh = Date.now();
        event.waitUntil(storeShell(response.clone()).then(syncStaticAssets).catch(() => undefined));
      }
    } else {
      event.waitUntil(refreshShell());
    }
    return response;
  } catch (err) {
    return (await caches.match(SHELL_URL, { cacheName: SHELL_CACHE })) ||
      (await caches.match(OFFLINE_URL, { cacheName: SHELL_CACHE }));
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(event) {
  const { request } = event;
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then(async (response) => {
      // opaque（no-cors）レスポンスは中身が見えないうえ容量を多く使うので保存しない
      if (response.ok) {
        await cache.put(request, response.clone());
        await trimCache(RUNTIME_CACHE, RUNTIME_MAX_ENTRIES);
      }
      return response;
    })
    .catch(() => cached);
  if (cached) {
    event.waitUntil(network);
    return cached;
  }
  return network;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  if (sameOrigin && isNoCachePath(url)) return;

  if (request.mode === 'navigate' && sameOrigin) {
    event.respondWith(handleNavigation(event));
    return;
  }

  if (sameOrigin && url.pathname.startsWith('/static/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (isCacheableAsset(url)) {
    event.respondWith(staleWhileRevalidate(event));
  }
});
