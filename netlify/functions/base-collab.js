// BASE「インフルエンサーコラボ」の販売中商品を返す（SOLD OUT 除外、CDN 1時間キャッシュ）
// 失敗時は 502 + source:'fallback'（フロントは Firestore links にフォールバック）
const { CATEGORY_URL, fetchCollab } = require('../lib/base-collab');
const { cacheHeaders, json } = require('../lib/http');

exports.handler = async () => {
  try {
    const all = await fetchCollab();
    const items = all.filter((i) => !i.soldOut).map(({ soldOut, ...i }) => i);
    return json(200, { source: 'base', items, parsedCount: all.length, soldOutCount: all.length - items.length, page: CATEGORY_URL },
      { ...cacheHeaders({ browser: 300, cdn: 3600 }), 'X-Collab-Source': 'base' });
  } catch (e) {
    console.error('base-collab error:', e.message);
    return json(502, { source: 'fallback', error: e.message }, { 'Cache-Control': 'no-store', 'X-Collab-Source': 'fallback' });
  }
};
