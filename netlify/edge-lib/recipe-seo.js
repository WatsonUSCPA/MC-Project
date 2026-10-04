// レシピ詳細ページの SEO 用 HTML を作る（Edge Function から使う純粋な関数だけを置く）
// - Firestore の読み取りは公開 REST API（netlify/lib/firestore-rest.js と同じ方式）
// - うさんこ・Kon のレシピは「材料＋動画＋サムネ＋リンク」だけ。作り方の手順はどのレシピでも出さない
// - パートナーの定義は netlify/lib/partners.js と同じ（Edge Function は CommonJS を読めないため複製）

// 本番は www なしが正（www は 301 でこちらへリダイレクトされる）。canonical・og:url・og:image はリダイレクトしない URL にする
export const SITE_ORIGIN = 'https://mcsquareofficials.com';
const PROJECT_ID = 'link-manager-f4ea8';
const FIRESTORE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
export const RECIPE_FIELDS = ['title', 'description', 'ingredients', 'youtubeUrl', 'pdfUrl', 'authorId', 'authorSNS', 'source', 'createdAt', 'youtubePublishedAt'];
// 説明文に作り方の要約が入っているため、説明文を出さないパートナー（材料＋動画＋サムネ＋リンクのみのルール）
const NO_DESCRIPTION_PARTNERS = ['usanko', 'quiltkon'];

const PARTNERS = [
  { id: 'usanko', name: 'うさんこチャンネル', authorIds: ['lovFHr9YdbWWcBel0JWBu9kAcU52'], website: 'https://www.youtube.com/@usanko_ch' },
  { id: 'clover', name: 'クロバー株式会社', authorIds: ['3hVe8DKmhGQnxWE7DmAOREuHgJH3'], website: 'https://clover.co.jp/' },
  { id: 'quiltkon', name: 'Kon｜ミシンキルト', authorIds: ['partner-quiltkon'], website: 'https://www.youtube.com/@p_quiltkon' },
];

export const isValidId = (id) => /^[A-Za-z0-9_-]{1,128}$/.test(String(id || ''));

const isHttpsUrl = (u) => {
  if (typeof u !== 'string' || !u.trim()) return false;
  try { return new URL(u).protocol === 'https:'; } catch { return false; }
};

export function getRecipeSource(data) {
  if (!data) return null;
  const explicit = data.source && typeof data.source === 'object' ? data.source : null;
  const partner = (explicit && PARTNERS.find((p) => p.id === explicit.partner)) ||
    PARTNERS.find((p) => p.authorIds.includes(data.authorId));
  if (!partner) return null;
  const url = [explicit && explicit.url, data.youtubeUrl, data.pdfUrl, data.authorSNS && data.authorSNS.website, partner.website].find(isHttpsUrl);
  return {
    partnerId: partner.id,
    name: (explicit && typeof explicit.name === 'string' && explicit.name.trim()) || partner.name,
    url,
  };
}

// ---- Firestore REST の値 → 普通の JS 値
function decodeValue(v) {
  if (!v || typeof v !== 'object') return undefined;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(decodeValue);
  if ('mapValue' in v) return decodeFields(v.mapValue.fields || {});
  return undefined;
}
function decodeFields(fields) {
  const out = {};
  for (const [k, v] of Object.entries(fields || {})) out[k] = decodeValue(v);
  return out;
}

export function recipeDocUrl(id) {
  const qs = RECIPE_FIELDS.map((f) => `mask.fieldPaths=${encodeURIComponent(f)}`).join('&');
  return `${FIRESTORE}/recipes/${encodeURIComponent(id)}?${qs}`;
}

// Firestore のドキュメント（REST の形）→ ページに出す情報。パートナー以外のレシピは null
export function toRecipe(doc) {
  if (!doc || !doc.name) return null;
  const data = decodeFields(doc.fields);
  const source = getRecipeSource(data);
  if (!source || !data.title) return null;
  const id = String(doc.name).split('/').pop();
  return {
    id,
    title: String(data.title).trim(),
    description: NO_DESCRIPTION_PARTNERS.includes(source.partnerId) ? '' : String(data.description || '').trim(),
    ingredients: (Array.isArray(data.ingredients) ? data.ingredients : []).map((s) => String(s).trim()).filter(Boolean).slice(0, 40),
    youtubeId: youtubeId(data.youtubeUrl) || youtubeId(source.url),
    sourceUrl: source.url || null,
    partnerName: source.name,
    createdAt: data.createdAt || null,
    youtubePublishedAt: typeof data.youtubePublishedAt === 'string' ? data.youtubePublishedAt : null,
    updateTime: doc.updateTime || '',
  };
}

export function youtubeId(url) {
  if (!isHttpsUrl(url)) return null;
  try {
    const u = new URL(url);
    let id = null;
    if (u.hostname === 'youtu.be') id = u.pathname.slice(1);
    else if (/(^|\.)youtube\.com$/.test(u.hostname)) {
      id = u.searchParams.get('v') || (u.pathname.match(/^\/(?:shorts|embed|live)\/([^/?#]+)/) || [])[1] || null;
    }
    return id && /^[A-Za-z0-9_-]{6,20}$/.test(id) ? id : null;
  } catch { return null; }
}

// ---- HTML 生成
export const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// <script> の中に入れる JSON（</script> で抜けられないようにする）
const safeJson = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
const clip = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

export function buildMeta(r) {
  const pageUrl = `${SITE_ORIGIN}/gallery/detail/${r.id}`;
  const image = `${SITE_ORIGIN}/.netlify/functions/recipe-image?c=recipes&id=${encodeURIComponent(r.id)}&f=main&w=960&v=${encodeURIComponent(r.updateTime)}`;
  const title = `${r.title}｜${r.partnerName}のレシピ｜エムシースクエア クラフトキッチン`;
  const base = r.description || (r.ingredients.length ? `材料：${r.ingredients.join('、')}` : '');
  const description = clip(`${r.partnerName}のレシピ。${base}`.replace(/\s+/g, ' '), 120);

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'エムシースクエア', item: `${SITE_ORIGIN}/` },
      { '@type': 'ListItem', position: 2, name: 'クラフトキッチン', item: `${SITE_ORIGIN}/gallery` },
      { '@type': 'ListItem', position: 3, name: r.title, item: pageUrl },
    ],
  };
  const jsonLd = [breadcrumb];
  // 動画のあるレシピだけ VideoObject。uploadDate は YouTube の公開日（youtubePublishedAt）を優先し、
  // まだ入っていないレシピはサイトへの登録日で代用する。どちらもないときは出さない
  const uploadDate = r.youtubePublishedAt || r.createdAt;
  if (r.youtubeId && uploadDate) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: r.title,
      description,
      thumbnailUrl: [`https://i.ytimg.com/vi/${r.youtubeId}/hqdefault.jpg`],
      uploadDate,
      embedUrl: `https://www.youtube.com/embed/${r.youtubeId}`,
      contentUrl: `https://www.youtube.com/watch?v=${r.youtubeId}`,
    });
  }

  const head = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<link rel="canonical" href="${escapeHtml(pageUrl)}" />`,
    `<meta property="og:type" content="article" />`,
    `<meta property="og:site_name" content="エムシースクエア" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${escapeHtml(pageUrl)}" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    ...jsonLd.map((o) => `<script type="application/ld+json">${safeJson(o)}</script>`),
  ].join('\n    ');

  // JS が動く前（＝検索エンジンが最初に読む HTML）に入る本文。React の描画で置き換わる
  const body = [
    '<main class="seo-prerender" style="max-width:860px;margin:0 auto;padding:1.5rem 1rem">',
    `<p><a href="/gallery">クラフトキッチン</a> › ${escapeHtml(r.title)}</p>`,
    `<h1>${escapeHtml(r.title)}</h1>`,
    `<p>${escapeHtml(r.partnerName)}のレシピ</p>`,
    `<img src="${escapeHtml(image)}" alt="${escapeHtml(r.title)}" width="480" style="max-width:100%;height:auto" />`,
    r.description ? `<p>${escapeHtml(r.description)}</p>` : '',
    r.ingredients.length ? `<h2>材料</h2><ul>${r.ingredients.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>` : '',
    r.sourceUrl ? `<p><a href="${escapeHtml(r.sourceUrl)}" rel="noopener">${r.youtubeId ? '動画で作り方を見る' : '元のレシピページを見る'}</a></p>` : '',
    '</main>',
  ].filter(Boolean).join('');

  return { head, body };
}

// index.html にメタ情報と本文を差し込む。既存の <title> と説明文は置き換える
export function injectIntoHtml(html, { head, body }) {
  if (!html.includes('<div id="root"></div>') || !html.includes('</head>')) return null;
  return html
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/<meta name="description"[^>]*>/, '')
    .replace('</head>', `    ${head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`);
}
