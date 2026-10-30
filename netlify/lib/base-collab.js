// BASE「インフルエンサーコラボ」カテゴリページの解析（関数とチェックスクリプトで共用）
const CATEGORY_URL = 'https://mcsquare.thebase.in/categories/6843582';
const ITEM_URL_RE = /^https:\/\/mcsquare\.thebase\.in\/items\/\d+$/;

// BASE の商品名に含まれるキーワード → インフルエンサーのページ（上から順に最初に一致したもの）
const INFLUENCERS = [
  { keywords: ['quiltkon', 'quilt kon', 'p-quilt', 'p_quilt'], url: 'https://www.instagram.com/p_quiltkon/' },
  { keywords: ['yasumin'], url: 'https://www.youtube.com/@yasumin' },
  { keywords: ['小春'], url: 'https://www.youtube.com/@koharushandmade' },
  { keywords: ['ami-chiku', 'amichiku'], url: 'https://www.instagram.com/amichikulabo/' },
  { keywords: ['あかりや'], url: 'https://www.instagram.com/akariya_91/' },
  { keywords: ['うさんこ'], url: 'https://www.instagram.com/usanko_ch/' },
];

function influencerUrlFor(title) {
  const t = title.toLowerCase();
  const hit = INFLUENCERS.find((i) => i.keywords.some((k) => t.includes(k)));
  return hit ? hit.url : '';
}

const decode = (s) => s
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&#0?39;/g, "'").replace(/&nbsp;/g, ' ')
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
  .replace(/&amp;/g, '&')
  .trim();

// 全商品（SOLD OUT 含む）を返す
function parseItems(html) {
  const items = [];
  for (const raw of html.split('items-list_itemListLI_').slice(1)) {
    // 最後の商品はページ末尾まで続くので、その商品の </li> で切る（CSS クラス表の "soldOut" 誤検知防止）
    const b = raw.split('</li>')[0];
    const url = (b.match(/href="(https:\/\/mcsquare\.thebase\.in\/items\/\d+)"/) || [])[1];
    const title = (b.match(/items-list_title_[^"]*">([\s\S]*?)<\/p>/) || [])[1];
    if (!url || !title || !ITEM_URL_RE.test(url)) continue;
    const priceText = (b.match(/items-list_price_[^"]*">([^<]*)</) || [])[1] || '';
    const yen = (priceText.match(/(?:¥|JPY)\s*([\d,]+)/) || [])[1];
    const img = (b.match(/<img[^>]*src="([^"]+)"/) || [])[1] || '';
    const t = decode(title);
    items.push({
      title: t,
      price: yen ? Number(yen.replace(/,/g, '')) : null,
      imageUrl: img.startsWith('https://') ? decode(img) : '',
      url,
      influencerUrl: influencerUrlFor(t),
      soldOut: /items-list_soldOut_[^"]*">\s*SOLD OUT/.test(b),
    });
  }
  return items;
}

// ページ取得＋解析。失敗（HTTP エラー・0件）は例外
async function fetchCollab() {
  const res = await fetch(CATEGORY_URL, { headers: { 'User-Agent': 'Mozilla/5.0 (mcsquareofficials.com collab sync)' } });
  if (!res.ok) throw new Error(`BASE page HTTP ${res.status}`);
  const all = parseItems(await res.text());
  if (all.length === 0) throw new Error('BASE page returned 200 but 0 items were parsed (layout changed?)');
  return all;
}

module.exports = { CATEGORY_URL, INFLUENCERS, parseItems, fetchCollab };
