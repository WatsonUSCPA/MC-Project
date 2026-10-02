// クラフトキッチン用の軽量レシピ一覧（パートナーのレシピのみ・画像本体は含めない）
// 旧実装はブラウザが recipes コレクション全体（base64画像込みで約11MB）を読み込んでいた
const { listWithFields } = require('../lib/firestore-rest');
const { getRecipeSource } = require('../lib/partners');
const { cacheHeaders, json } = require('../lib/http');

const RECIPE_FIELDS = ['title', 'authorId', 'authorSNS', 'source', 'difficulty', 'cookingTime', 'likes', 'views',
  'createdAt', 'description', 'tags', 'youtubeUrl', 'pdfUrl', 'ingredients'];

const imageUrl = (c, id, f, v, w) =>
  `/.netlify/functions/recipe-image?c=${c}&id=${encodeURIComponent(id)}&f=${f}&w=${w}&v=${encodeURIComponent(v || '')}`;

// キーワード・シチュエーションの画像：通常のURLならそのまま、base64なら画像関数経由
async function listCategory(collection) {
  const rows = await listWithFields(collection, ['name', 'order', 'image']);
  return rows
    .map(({ id, updateTime, data }) => {
      const img = typeof data.image === 'string' ? data.image : '';
      const image = img.startsWith('data:') ? imageUrl(collection, id, 'image', updateTime, 160)
        : (img.startsWith('https://') || img.startsWith('/Image/')) ? img : '';
      return { id, name: data.name || '', order: data.order || 0, image };
    })
    .sort((a, b) => a.order - b.order);
}

exports.handler = async () => {
  try {
    const [rows, keywords, situations] = await Promise.all([
      listWithFields('recipes', RECIPE_FIELDS),
      listCategory('popularKeywords').catch(() => []),
      listCategory('situationCategories').catch(() => []),
    ]);
    const recipes = [];
    for (const { id, updateTime, data } of rows) {
      const source = getRecipeSource(data);
      if (!source) continue; // パートナー以外は掲載しない
      recipes.push({
        id,
        title: data.title || '',
        partnerId: source.partnerId,
        partnerName: source.name,
        sourceUrl: source.url || null,
        sourceLabel: source.linkLabel,
        difficulty: data.difficulty || '',
        cookingTime: data.cookingTime || '',
        likes: data.likes || 0,
        views: data.views || 0,
        createdAt: data.createdAt || null,
        description: String(data.description || '').slice(0, 160),
        tags: Array.isArray(data.tags) ? data.tags.slice(0, 20) : [],
        ingredients: Array.isArray(data.ingredients) ? data.ingredients.slice(0, 20).map((s) => String(s).slice(0, 60)) : [],
        authorSNS: data.authorSNS || {},
        thumb: imageUrl('recipes', id, 'main', updateTime, 480),
        image: imageUrl('recipes', id, 'main', updateTime, 960),
      });
    }
    return json(200, { recipes, keywords, situations, generatedAt: new Date().toISOString() }, cacheHeaders({ browser: 60, cdn: 600 }));
  } catch (e) {
    console.error('recipes-index error:', e.message);
    return json(502, { error: 'レシピ一覧の取得に失敗しました' }, { 'Cache-Control': 'no-store' });
  }
};
