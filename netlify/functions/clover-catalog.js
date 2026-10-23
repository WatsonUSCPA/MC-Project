// 取り扱い中のクロバー商品の一覧（ショップの「道具」ページ用）
// - 商品・価格はサーバー側の価格表（netlify/lib/clover-products.json）だけを使う
// - 画像と「使われているレシピ」は、クロバーのレシピの affiliateProducts から拾う
// - affiliateProducts は base64 画像込みで重い（約5MB）ので、CDN に長めにキャッシュする
const { getRecipeSource, PARTNERS } = require('../lib/partners');
const { decodeFields } = require('../lib/firestore-rest');
const { cacheHeaders, json } = require('../lib/http');
const CLOVER_PRODUCTS = require('../lib/clover-products.json');

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'link-manager-f4ea8';
const RUN_QUERY = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`;
const TIMEOUT_MS = 9000;
const MAX_RECIPES_PER_PRODUCT = 3;

const CLOVER = PARTNERS.find((p) => p.id === 'clover');
const normalizeUrl = (u) => String(u || '').trim().replace(/\/$/, '').replace('://www.', '://');
const affImage = (id, i, v) => `/.netlify/functions/recipe-image?c=recipes&id=${encodeURIComponent(id)}&f=aff${i}&w=320&v=${encodeURIComponent(v || '')}`;

async function fetchCloverRecipes() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(RUN_QUERY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'recipes' }],
          select: { fields: ['title', 'authorId', 'source', 'affiliateProducts'].map((f) => ({ fieldPath: f })) },
          where: { fieldFilter: { field: { fieldPath: 'authorId' }, op: 'EQUAL', value: { stringValue: CLOVER.authorIds[0] } } },
        },
      }),
    });
    if (!res.ok) throw new Error(`Firestore ${res.status}`);
    const rows = await res.json();
    return (rows || [])
      .filter((r) => r.document)
      .map((r) => ({ id: r.document.name.split('/').pop(), updateTime: r.document.updateTime, data: decodeFields(r.document.fields) }));
  } finally {
    clearTimeout(timer);
  }
}

exports.handler = async () => {
  try {
    const recipes = await fetchCloverRecipes();
    const byUrl = new Map(CLOVER_PRODUCTS.map((p) => [normalizeUrl(p.productUrl), { ...p, image: '', recipes: [] }]));
    for (const { id, updateTime, data } of recipes) {
      const source = getRecipeSource(data);
      if (!source || source.partnerId !== 'clover') continue;
      (Array.isArray(data.affiliateProducts) ? data.affiliateProducts : []).forEach((a, i) => {
        const p = a && byUrl.get(normalizeUrl(a.productUrl));
        if (!p) return;
        if (!p.image && typeof a.imageUrl === 'string') {
          if (a.imageUrl.startsWith('data:')) p.image = affImage(id, i, updateTime);
          else if (a.imageUrl.startsWith('https://')) p.image = a.imageUrl;
        }
        if (!p.recipes.some((r) => r.id === id)) p.recipes.push({ id, title: String(data.title || '').slice(0, 80) });
      });
    }
    // 多くのレシピで使われている順
    const products = [...byUrl.values()]
      .map((p) => ({ ...p, recipeCount: p.recipes.length, recipes: p.recipes.slice(0, MAX_RECIPES_PER_PRODUCT) }))
      .sort((a, b) => b.recipeCount - a.recipeCount || a.productNumber.localeCompare(b.productNumber));
    return json(200, { products, generatedAt: new Date().toISOString() }, cacheHeaders({ browser: 300, cdn: 21600 }));
  } catch (e) {
    console.error('clover-catalog error:', e.message);
    return json(502, { error: '商品一覧の取得に失敗しました' }, { 'Cache-Control': 'no-store' });
  }
};
