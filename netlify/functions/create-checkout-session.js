// Stripe Checkout セッション作成
// セキュリティ方針:
//  - ブラウザから送られた価格・送料・商品名は一切信用しない
//  - 受け取るのは「商品ID・種類・数量」のみ。価格はサーバー側で商品データから取得する
//  - success_url / cancel_url はサイト自身のURL（環境変数）から組み立てる
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// 生地の商品データ（AllProducts.tsx と同じ Google Apps Script）
const PRODUCTS_API_URL = process.env.PRODUCTS_API_URL ||
  'https://script.google.com/macros/s/AKfycbygEEOmylE1fzaMtpxAReEQfY02zIcUVKwVPaV4R5H5AKWnQtgnUbYOKfq3y4mYJPdzYg/exec';
// レシピ（キット）データ（KitsNew.tsx と同じ Firestore の kits コレクション）
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'link-manager-f4ea8';

const MAX_LINE_ITEMS = 50;      // 1回の注文で扱う商品の種類の上限
const MAX_FABRIC_QUANTITY = 99; // 生地1種類あたりの数量上限
const FREE_KIT_LIMIT = 2;       // 生地を1点以上購入でレシピ2個まで無料（KitsNew.tsx のルール）

// キャンセル時に戻れるページ（これ以外はすべて /all-products）
const ALLOWED_RETURN_PATHS = [
  '/', '/all-products', '/kits', '/influencer_subscription', '/subscription',
  '/contact', '/terms', '/privacy', '/legal',
];

const ALLOWED_ORIGINS = [process.env.URL, process.env.DEPLOY_PRIME_URL, process.env.DEPLOY_URL, process.env.SITE_URL]
  .filter(Boolean)
  .map((u) => u.replace(/\/$/, ''));

// 送料（AllProducts.tsx / ECHeader.tsx と同じルール）
const calcShipping = (subtotal) => {
  if (subtotal <= 0) return 0;
  if (subtotal < 4400) return 400;
  if (subtotal < 24200) return 900;
  return 0;
};

// "1,100円" / "¥300" / 1100 などを整数の円に変換
const parseYen = (value) => {
  const n = Number(String(value ?? '').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : NaN;
};

// サイト自身のURL（リクエスト内容からは決めない）
const getSiteUrl = () => {
  const explicit = process.env.SITE_URL; // 任意で上書き可能
  const fromNetlify = process.env.CONTEXT === 'production'
    ? process.env.URL
    : (process.env.DEPLOY_PRIME_URL || process.env.DEPLOY_URL || process.env.URL);
  const url = explicit || fromNetlify;
  if (!url) throw new Error('SITE_URL/URL is not configured');
  return url.replace(/\/$/, '');
};

const toAbsoluteImageUrl = (url, siteUrl) => {
  if (!url || typeof url !== 'string') return undefined;
  if (/^https:\/\//.test(url)) return encodeURI(decodeURI(url));
  if (url.startsWith('/Image/') || url.startsWith('Image/')) {
    return encodeURI(`${siteUrl}/${url.replace(/^\//, '')}`);
  }
  return undefined;
};

// Google Apps Script は応答に数秒〜10秒以上かかることがあるため、
// 起動中の関数インスタンス内で短時間キャッシュし、タイムアウトも設ける
const PRODUCT_CACHE_MS = 5 * 60 * 1000;
const FETCH_TIMEOUT_MS = Number(process.env.PRODUCTS_FETCH_TIMEOUT_MS || 8000);
let productCache = { at: 0, map: null };

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchFabricProducts() {
  if (productCache.map && Date.now() - productCache.at < PRODUCT_CACHE_MS) {
    return productCache.map;
  }
  const res = await fetchWithTimeout(PRODUCTS_API_URL, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`product data fetch failed (${res.status})`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error('product data has unexpected format');
  const map = new Map();
  for (const p of data) {
    if (p && p.status === '公開中' && p.managementNumber != null) {
      const id = String(p.managementNumber);
      if (!map.has(id)) map.set(id, p); // 重複IDは最初の1件を採用
    }
  }
  productCache = { at: Date.now(), map };
  return map;
}

async function fetchKit(id) {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) return null;
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/kits/${encodeURIComponent(id)}`;
  const res = await fetchWithTimeout(url);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`kit fetch failed (${res.status})`);
  const doc = await res.json();
  const f = doc.fields || {};
  const val = (x) => (x ? (x.stringValue ?? x.integerValue ?? x.doubleValue) : undefined);
  return { id, name: val(f.name), price: val(f.price), imageUrl: val(f.imageUrl) };
}

// ブラウザから受け取った { id, type, quantity } を検証してまとめる
function normalizeRequestedItems(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return { error: 'Cart is empty.' };
  }
  if (rawItems.length > MAX_LINE_ITEMS) {
    return { error: 'Too many items.' };
  }
  const merged = new Map();
  for (const raw of rawItems) {
    if (!raw || typeof raw !== 'object') return { error: 'Invalid item.' };
    const id = String(raw.id ?? '').trim();
    const type = raw.type === 'kit' ? 'kit' : raw.type === 'fabric' ? 'fabric' : null;
    const quantity = Number(raw.quantity);
    if (!id || id.length > 128 || !type) return { error: 'Invalid item.' };
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_FABRIC_QUANTITY) {
      return { error: 'Invalid quantity.' };
    }
    const key = `${type}:${id}`;
    const prev = merged.get(key);
    merged.set(key, { id, type, quantity: (prev ? prev.quantity : 0) + quantity });
  }
  const items = [...merged.values()].map((it) => (
    it.type === 'kit' ? { ...it, quantity: 1 } : it // レシピは1個まで
  ));
  if (items.some((it) => it.quantity > MAX_FABRIC_QUANTITY)) return { error: 'Invalid quantity.' };
  return { items };
}

// サーバー側で価格・送料を確定させて Stripe の line_items を作る
async function buildLineItems(requested, siteUrl) {
  const hasFabric = requested.some((it) => it.type === 'fabric');
  const kitIds = requested.filter((it) => it.type === 'kit').map((it) => it.id);
  // 生地データとレシピデータを並行して取得
  const [fabrics, kitList] = await Promise.all([
    hasFabric ? fetchFabricProducts() : Promise.resolve(new Map()),
    Promise.all(kitIds.map((id) => fetchKit(id))),
  ]);
  const kits = new Map(kitIds.map((id, i) => [id, kitList[i]]));

  const lineItems = [];
  let subtotal = 0;
  let freeKitsUsed = 0;

  for (const it of requested) {
    if (it.type === 'fabric') {
      const p = fabrics.get(it.id);
      if (!p) return { error: `Product not available: ${it.id}` };
      const unit = parseYen(p.price);
      if (!Number.isFinite(unit) || unit <= 0) return { error: `Invalid price for: ${it.id}` };
      subtotal += unit * it.quantity;
      lineItems.push({
        price_data: {
          currency: 'jpy',
          product_data: {
            name: String(p.name || it.id).slice(0, 250),
            description: p.description ? String(p.description).slice(0, 500) : `管理番号: ${it.id}`,
            metadata: { managementNumber: it.id, productType: 'fabric' },
            images: toAbsoluteImageUrl(p.imageUrl, siteUrl) ? [toAbsoluteImageUrl(p.imageUrl, siteUrl)] : undefined,
          },
          unit_amount: unit,
        },
        quantity: it.quantity,
      });
    } else {
      const kit = kits.get(it.id);
      if (!kit || !kit.name) return { error: `Recipe not available: ${it.id}` };
      const listPrice = parseYen(kit.price);
      if (!Number.isFinite(listPrice)) return { error: `Invalid price for: ${it.id}` };
      const isFree = hasFabric && freeKitsUsed < FREE_KIT_LIMIT;
      if (isFree) freeKitsUsed += 1;
      const unit = isFree ? 0 : listPrice;
      subtotal += unit;
      lineItems.push({
        price_data: {
          currency: 'jpy',
          product_data: {
            name: `${String(kit.name).slice(0, 240)}${isFree ? ' (無料)' : ''}`,
            description: `管理番号: ${it.id}`,
            metadata: { managementNumber: it.id, productType: 'kit' },
            images: toAbsoluteImageUrl(kit.imageUrl, siteUrl) ? [toAbsoluteImageUrl(kit.imageUrl, siteUrl)] : undefined,
          },
          unit_amount: unit,
        },
        quantity: 1,
      });
    }
  }

  if (subtotal <= 0) return { error: 'Order total must be greater than 0.' };

  const shipping = calcShipping(subtotal);
  if (shipping > 0) {
    lineItems.push({
      price_data: {
        currency: 'jpy',
        product_data: {
          name: '送料',
          description: '商品の配送料金',
          metadata: { managementNumber: 'shipping' },
        },
        unit_amount: shipping,
      },
      quantity: 1,
    });
  }
  return { lineItems, subtotal, shipping };
}

exports.handler = async (event) => {
  const requestOrigin = (event.headers && (event.headers.origin || event.headers.Origin)) || '';
  const headers = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(requestOrigin) ? requestOrigin : (ALLOWED_ORIGINS[0] || ''),
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY is not set');
    return { statusCode: 500, headers, body: JSON.stringify({ error: '決済の設定が完了していません' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { items, error: itemError } = normalizeRequestedItems(body.items);
  if (itemError) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: itemError }) };
  }

  try {
    const siteUrl = getSiteUrl();
    const built = await buildLineItems(items, siteUrl);
    if (built.error) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: built.error }) };
    }

    const returnPath = ALLOWED_RETURN_PATHS.includes(body.returnPath) ? body.returnPath : '/all-products';
    const from = body.from === 'header-cart' ? 'header-cart' : 'react-cart';

    // ログには個人情報や全文を残さず、件数と金額だけを出す
    console.log('Creating Stripe session', { lineItems: built.lineItems.length, subtotal: built.subtotal, shipping: built.shipping });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: built.lineItems,
      mode: 'payment',
      success_url: `${siteUrl}/success`,
      cancel_url: `${siteUrl}${returnPath}`,
      metadata: { from, subtotal: String(built.subtotal), shipping: String(built.shipping) },
      currency: 'jpy',
      locale: 'ja',
      shipping_address_collection: { allowed_countries: ['JP'] },
    });

    console.log('Stripe session created:', session.id);
    return { statusCode: 200, headers, body: JSON.stringify({ url: session.url }) };
  } catch (error) {
    console.error('Checkout error:', error && error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: '決済セッションの作成に失敗しました' }),
    };
  }
};

// テスト用に内部関数を公開
exports._internal = { normalizeRequestedItems, buildLineItems, calcShipping, parseYen };
