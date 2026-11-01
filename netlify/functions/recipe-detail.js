// レシピ1件の詳細（メイン画像の base64 は除き、画像は画像関数のURLに置き換える）
const { getWithFields } = require('../lib/firestore-rest');
const { getRecipeSource } = require('../lib/partners');
const { cacheHeaders, json } = require('../lib/http');
const { openStore, getJSON, setJSON } = require('../lib/blob-cache');
let netlifyBlobs = null;
try { netlifyBlobs = require('@netlify/blobs'); } catch (e) { console.warn('@netlify/blobs not available'); }

// レシピは作成のみで中身はほぼ変わらないので、Netlify Blobs に2日保存（デプロイをまたいで残る）。
// その間は Firestore を読まない。Firestore が読めない（429 など）ときは古い保存分を返す
const BLOB_TTL_MS = 2 * 24 * 60 * 60 * 1000;
const blobKey = (id) => `recipe-detail:v2:${id}`;

const FIELDS = ['title', 'description', 'ingredients', 'steps', 'pdfUrl', 'cookingTime', 'difficulty', 'youtubeUrl',
  'explanationType', 'websiteExplanation', 'affiliateProducts', 'authorSNS', 'authorId', 'source', 'likes', 'views', 'tags', 'createdAt', 'youtubePublishedAt'];

const img = (id, f, v, w) => `/.netlify/functions/recipe-image?c=recipes&id=${encodeURIComponent(id)}&f=${f}&w=${w}&v=${encodeURIComponent(v || '')}`;

async function load(id) {
  const doc = await getWithFields('recipes', id, FIELDS);
  const source = doc && getRecipeSource(doc.data);
  if (!doc || !source) return null;
  // 画像URLの v は作成日時（閲覧数の+1で変わらない → 画像のキャッシュが効き続ける）
  doc.updateTime = doc.createTime || doc.updateTime;
  const d = doc.data;
  const affiliateProducts = (Array.isArray(d.affiliateProducts) ? d.affiliateProducts : []).map((p, i) => ({
    name: p.name || '',
    description: p.description || '',
    price: p.price || '',
    productUrl: typeof p.productUrl === 'string' && p.productUrl.startsWith('https://') ? p.productUrl : '',
    imageUrl: typeof p.imageUrl === 'string' && p.imageUrl.startsWith('data:') ? img(doc.id, `aff${i}`, doc.updateTime, 320)
      : (typeof p.imageUrl === 'string' && p.imageUrl.startsWith('https://') ? p.imageUrl : ''),
  }));
  const steps = (Array.isArray(d.steps) ? d.steps : []).map((s, i) => ({
    ...s,
    image: typeof s.image === 'string' && s.image.startsWith('data:') ? img(doc.id, `step${i}`, doc.updateTime, 800) : s.image,
  }));
  return {
    id: doc.id,
    ...d,
    authorId: undefined,
    steps,
    affiliateProducts,
    partnerId: source.partnerId,
    partnerName: source.name,
    sourceUrl: source.url || null,
    sourceLabel: source.linkLabel,
    mainImageUrl: img(doc.id, 'main', doc.updateTime, 960),
    thumb: img(doc.id, 'main', doc.updateTime, 480),
  };
}

exports.handler = async (event) => {
  const id = String((event.queryStringParameters || {}).id || '');
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) return json(404, { error: 'not found' }, cacheHeaders({ browser: 300, cdn: 3600 }));
  const store = openStore(event, netlifyBlobs);
  const cached = await getJSON(store, blobKey(id));
  const ok = (body, mode) => json(200, body, { ...cacheHeaders({ browser: 300, cdn: 86400, swr: 7 * 86400 }), 'X-CK-Cache': mode });
  if (cached && cached.body && Date.now() - (cached.savedAt || 0) < BLOB_TTL_MS) return ok(cached.body, 'blob');
  try {
    const body = await load(id);
    if (!body) return json(404, { error: 'not found' }, cacheHeaders({ browser: 300, cdn: 3600 }));
    await setJSON(store, blobKey(id), { savedAt: Date.now(), body });
    return ok(body, 'firestore');
  } catch (e) {
    console.error('recipe-detail error:', e.message);
    if (cached && cached.body) return json(200, cached.body, { ...cacheHeaders({ browser: 60, cdn: 300 }), 'X-CK-Cache': 'stale' });
    return json(502, { error: 'レシピの取得に失敗しました' }, { 'Cache-Control': 'no-store' });
  }
};
