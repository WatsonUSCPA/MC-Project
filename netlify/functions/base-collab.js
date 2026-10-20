// BASE ショップの「インフルエンサーコラボ」カテゴリから販売中の商品を取得する
// 公開カテゴリページの HTML を解析（API キー不要）。SOLD OUT は除外。CDN に 1 時間キャッシュ
const { cacheHeaders, json } = require('../lib/http');

const CATEGORY_URL = 'https://mcsquare.thebase.in/categories/6843582';
const ITEM_URL_RE = /^https:\/\/mcsquare\.thebase\.in\/items\/\d+$/;

const decode = (s) => s
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&nbsp;/g, ' ')
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
  .trim();

function parseItems(html) {
  const blocks = html.split('items-list_itemListLI_').slice(1);
  const items = [];
  for (const b of blocks) {
    const url = (b.match(/href="(https:\/\/mcsquare\.thebase\.in\/items\/\d+)"/) || [])[1];
    const title = (b.match(/items-list_title_[^"]*">([\s\S]*?)<\/p>/) || [])[1];
    if (!url || !title || !ITEM_URL_RE.test(url)) continue;
    const priceText = (b.match(/items-list_price_[^"]*">([^<]*)</) || [])[1] || '';
    const yen = (priceText.match(/¥\s*([\d,]+)/) || [])[1];
    const img = (b.match(/<img[^>]*src="([^"]+)"/) || [])[1] || '';
    items.push({
      title: decode(title),
      price: yen ? Number(yen.replace(/,/g, '')) : null,
      imageUrl: img.startsWith('https://') ? decode(img) : '',
      url,
      soldOut: /items-list_soldOut_|SOLD OUT/.test(b),
    });
  }
  return items;
}

exports.parseItems = parseItems;
exports.handler = async () => {
  try {
    const res = await fetch(CATEGORY_URL, { headers: { 'User-Agent': 'Mozilla/5.0 (mcsquareofficials.com collab sync)' } });
    if (!res.ok) throw new Error(`BASE ${res.status}`);
    const all = parseItems(await res.text());
    if (all.length === 0) throw new Error('no items parsed');
    const items = all.filter((i) => !i.soldOut).map(({ soldOut, ...i }) => i);
    return json(200, { items, soldOutCount: all.length - items.length, source: CATEGORY_URL },
      cacheHeaders({ browser: 300, cdn: 3600 }));
  } catch (e) {
    console.error('base-collab error:', e.message);
    return json(502, { error: 'failed' }, { 'Cache-Control': 'no-store' });
  }
};
