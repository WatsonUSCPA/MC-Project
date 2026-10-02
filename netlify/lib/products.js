// 生地の商品データ（Google Apps Script）の取得。応答が遅いので関数インスタンス内でキャッシュする
const PRODUCTS_API_URL = process.env.PRODUCTS_API_URL ||
  'https://script.google.com/macros/s/AKfycbygEEOmylE1fzaMtpxAReEQfY02zIcUVKwVPaV4R5H5AKWnQtgnUbYOKfq3y4mYJPdzYg/exec';
const CACHE_MS = 5 * 60 * 1000;
const TIMEOUT_MS = Number(process.env.PRODUCTS_FETCH_TIMEOUT_MS || 8000);
let cache = { at: 0, list: null };

async function fetchPublicProducts() {
  if (cache.list && Date.now() - cache.at < CACHE_MS) return cache.list;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(PRODUCTS_API_URL, { headers: { Accept: 'application/json' }, signal: controller.signal });
    if (!res.ok) throw new Error(`product data fetch failed (${res.status})`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('product data has unexpected format');
    const list = data.filter((p) => p && p.status === '公開中' && p.managementNumber != null);
    cache = { at: Date.now(), list };
    return list;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { fetchPublicProducts };
