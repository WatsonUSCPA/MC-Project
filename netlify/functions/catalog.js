// ショップの商品（生地）とキットの軽量一覧。レシピページの「このレシピに使える商品」用
// Google Apps Script は応答が遅い（2〜13秒）ため、CDN にキャッシュさせる
const { fetchPublicProducts } = require('../lib/products');
const { listWithFields } = require('../lib/firestore-rest');
const { cacheHeaders, json } = require('../lib/http');

exports.handler = async () => {
  try {
    const [products, kitRows] = await Promise.all([
      fetchPublicProducts().catch((e) => { console.error('products:', e.message); return null; }),
      listWithFields('kits', ['name', 'price', 'imageUrl', 'level', 'comment', 'fabricSize', 'createdAt']).catch(() => []),
    ]);
    const body = {
      products: (products || []).map((p) => ({
        managementNumber: String(p.managementNumber), name: p.name, price: p.price, imageUrl: p.imageUrl || '', status: p.status,
      })),
      kits: kitRows.map(({ id, data }) => ({ id, ...data })),
      productsAvailable: !!products,
    };
    // 商品データが取れなかったときは CDN に長く残さない
    return json(200, body, products ? cacheHeaders({ browser: 60, cdn: 300 }) : { 'Cache-Control': 'no-store' });
  } catch (e) {
    console.error('catalog error:', e.message);
    return json(502, { error: 'failed' }, { 'Cache-Control': 'no-store' });
  }
};
