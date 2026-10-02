// レシピ1件の詳細（メイン画像の base64 は除き、画像は画像関数のURLに置き換える）
const { getWithFields } = require('../lib/firestore-rest');
const { getRecipeSource } = require('../lib/partners');
const { cacheHeaders, json } = require('../lib/http');

const FIELDS = ['title', 'description', 'ingredients', 'steps', 'pdfUrl', 'cookingTime', 'difficulty', 'youtubeUrl',
  'explanationType', 'websiteExplanation', 'affiliateProducts', 'authorSNS', 'authorId', 'source', 'likes', 'views', 'tags', 'createdAt'];

const img = (id, f, v, w) => `/.netlify/functions/recipe-image?c=recipes&id=${encodeURIComponent(id)}&f=${f}&w=${w}&v=${encodeURIComponent(v || '')}`;

exports.handler = async (event) => {
  const id = (event.queryStringParameters || {}).id;
  try {
    const doc = await getWithFields('recipes', id, FIELDS);
    const source = doc && getRecipeSource(doc.data);
    if (!doc || !source) return json(404, { error: 'not found' }, cacheHeaders({ browser: 60, cdn: 300 }));
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
    return json(200, {
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
    }, cacheHeaders({ browser: 60, cdn: 600 }));
  } catch (e) {
    console.error('recipe-detail error:', e.message);
    return json(502, { error: 'レシピの取得に失敗しました' }, { 'Cache-Control': 'no-store' });
  }
};
