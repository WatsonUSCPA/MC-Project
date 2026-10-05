// Service Worker の登録（本番ビルドのみ）
// 新しい SW はインストール後すぐに有効になる（service-worker.js 側で skipWaiting している）
export function registerServiceWorker() {
  if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${process.env.PUBLIC_URL}/service-worker.js`)
      .catch((error) => {
        console.error('Service Worker の登録に失敗しました:', error);
      });
  });
}
