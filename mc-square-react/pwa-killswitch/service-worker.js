/* MC Square Service Worker 片付け用（kill switch）
 *
 * PWA をやめるとき・Service Worker に問題が起きたときの緊急用です。
 * 使い方: このファイルで mc-square-react/public/service-worker.js を置き換えてデプロイする。
 *   - 登録済みの Service Worker を解除し、MC Square が作ったキャッシュをすべて削除します
 *   - 開いているページは一度だけ再読み込みされ、以降は通常のサイトとして動きます
 *   - あわせて src/index.tsx の registerServiceWorker() 呼び出しを外してください
 * 置き換えたあとも、利用者のスマホから古い SW が消えるまで（数週間程度）はこのファイルを残しておくこと。
 */
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith('mc-')).map((key) => caches.delete(key)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((client) => client.navigate(client.url));
  })());
});
