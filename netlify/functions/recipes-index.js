// クラフトキッチン用の軽量レシピ一覧（パートナーのレシピのみ・画像本体は含めない）
// 旧実装はブラウザが recipes コレクション全体（base64画像込みで約11MB）を読み込んでいた
//
// Firestore の読み取りを減らす仕組み（無料枠は1日5万回）:
// - 一覧は Netlify Blobs に保存（デプロイでCDNキャッシュが消えても Firestore を読み直さない）
// - 全件の読み直し（レシピ数ぶんの読み取り）は1日1回だけ。いいね数・閲覧数・キーワードもこのとき更新
// - それ以外は1時間に1回「前回以降に作られたレシピ」だけを読む（新着数＋1回）。レシピは作成のみなので差分で足りる
// - Firestore が読めない（429 など）ときは保存済みの一覧を返す
const { listWithFields } = require('../lib/firestore-rest');
const { getRecipeSource } = require('../lib/partners');
const { cacheHeaders, json } = require('../lib/http');
const { openStore, getJSON, setJSON } = require('../lib/blob-cache');
let netlifyBlobs = null;
try { netlifyBlobs = require('@netlify/blobs'); } catch (e) { console.warn('@netlify/blobs not available'); }

const RECIPE_FIELDS = ['title', 'authorId', 'authorSNS', 'source', 'difficulty', 'cookingTime', 'likes', 'views',
  'createdAt', 'youtubePublishedAt', 'description', 'tags', 'youtubeUrl', 'pdfUrl', 'ingredients',
  'series'];

const BLOB_KEY = 'recipes-index:v2';
const FULL_REFRESH_MS = 24 * 60 * 60 * 1000;
const DELTA_REFRESH_MS = 60 * 60 * 1000;
const DELTA_OVERLAP_MS = 15 * 60 * 1000; // 時計のずれ対策で少し重ねて読む（重複はidで上書き）

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

// 画像URLの v は作成日時（createTime）。閲覧数の+1で updateTime が変わっても画像URLが変わらず、
// CDN・ブラウザ・Blobs のキャッシュが効き続ける（レシピは作成のみで画像は変わらない）
function toSummary({ id, createTime, updateTime, data }) {
  const source = getRecipeSource(data);
  if (!source) return null; // パートナー以外は掲載しない
  const v = createTime || updateTime;
  return {
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
    youtubePublishedAt: typeof data.youtubePublishedAt === 'string' ? data.youtubePublishedAt : null,
    description: String(data.description || '').slice(0, 160),
    tags: Array.isArray(data.tags) ? data.tags.slice(0, 20) : [],
    ingredients: Array.isArray(data.ingredients) ? data.ingredients.slice(0, 20).map((s) => String(s).slice(0, 60)) : [],
    // シリーズ（例: 'usanko-club' = うさんこクラブの布を使った作品。scripts/detect-usanko-fabric.js で判定）
    series: Array.isArray(data.series) ? data.series.filter((s) => typeof s === 'string').slice(0, 10) : [],
    authorSNS: data.authorSNS || {},
    thumb: imageUrl('recipes', id, 'main', v, 480),
    image: imageUrl('recipes', id, 'main', v, 960),
  };
}

async function fullSnapshot(now) {
  const [rows, keywords, situations] = await Promise.all([
    listWithFields('recipes', RECIPE_FIELDS),
    listCategory('popularKeywords').catch(() => []),
    listCategory('situationCategories').catch(() => []),
  ]);
  const recipes = rows.map(toSummary).filter(Boolean);
  return { recipes, keywords, situations, fullAt: now, deltaAt: now, generatedAt: new Date(now).toISOString() };
}

// 前回の差分取得以降に作られたレシピだけを読む（createdAt はサーバー時刻の Timestamp）
async function applyDelta(snap, now) {
  const since = new Date(snap.deltaAt - DELTA_OVERLAP_MS).toISOString();
  const rows = await listWithFields('recipes', RECIPE_FIELDS, {
    fieldFilter: { field: { fieldPath: 'createdAt' }, op: 'GREATER_THAN_OR_EQUAL', value: { timestampValue: since } },
  });
  const byId = new Map(snap.recipes.map((r) => [r.id, r]));
  for (const row of rows) {
    const s = toSummary(row);
    if (s) byId.set(s.id, s);
  }
  return { ...snap, recipes: [...byId.values()], deltaAt: now, generatedAt: new Date(now).toISOString() };
}

const publicBody = ({ recipes, keywords, situations, generatedAt }) => ({ recipes, keywords, situations, generatedAt });

exports.handler = async (event) => {
  const now = Date.now();
  const store = openStore(event, netlifyBlobs);
  const snap = await getJSON(store, BLOB_KEY);
  const hasSnap = !!(snap && Array.isArray(snap.recipes));
  let mode = 'blob';
  let out = snap;
  try {
    if (!hasSnap || now - (snap.fullAt || 0) > FULL_REFRESH_MS) {
      mode = 'full';
      out = await fullSnapshot(now);
      await setJSON(store, BLOB_KEY, out);
    } else if (now - (snap.deltaAt || 0) > DELTA_REFRESH_MS) {
      mode = 'delta';
      out = await applyDelta(snap, now);
      await setJSON(store, BLOB_KEY, out);
    }
  } catch (e) {
    console.error(`recipes-index ${mode} error:`, e.message);
    if (!hasSnap) return json(502, { error: 'レシピ一覧の取得に失敗しました' }, { 'Cache-Control': 'no-store' });
    out = snap;
    mode = 'stale';
  }
  const cache = mode === 'stale' ? { browser: 60, cdn: 300 } : { browser: 300, cdn: 3600, swr: 7 * 86400 };
  return json(200, publicBody(out), { ...cacheHeaders(cache), 'X-CK-Cache': mode });
};
