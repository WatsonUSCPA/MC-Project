// Firestore に base64 で保存された画像を、指定サイズの WebP に縮小して返す
// URL に作成日時など(v)が入っているので、CDN とブラウザに1年キャッシュさせられる
const { getWithFields } = require('../lib/firestore-rest');
const { cacheHeaders } = require('../lib/http');
const { openStore, getBinary, setBinary, getText, setText } = require('../lib/blob-cache');
let netlifyBlobs = null;
try { netlifyBlobs = require('@netlify/blobs'); } catch (e) { console.warn('@netlify/blobs not available'); }

// Firestore の読み取りを減らすため、Netlify Blobs に保存（デプロイでCDNキャッシュが消えても残る）
// - 縮小済み画像（幅ごと）と、元画像（base64 / https のURL）の両方を保存
// - 同じ画像は Firestore から一度だけ読む（別の幅を作るときも元画像の保存分を使う）
// - URL に v（作成日時など）が入っているので、v が変われば別の画像として扱う
const keyPart = (s) => encodeURIComponent(String(s || '')).replace(/%/g, '_');
const srcKey = (c, id, f, v) => `img-src:v1:${c}:${keyPart(id)}:${f}:${keyPart(v)}`;
const outKey = (c, id, f, v, w) => `img-out:v1:${c}:${keyPart(id)}:${f}:${w}:${keyPart(v)}`;

let sharp = null;
try { sharp = require('sharp'); } catch (e) { console.warn('sharp not available; serving original images'); }

const COLLECTIONS = { recipes: true, popularKeywords: true, situationCategories: true };
const WIDTHS = [160, 320, 480, 800, 960];

function pickField(c, f, data) {
  if (c === 'recipes' && f === 'main') return data.mainImageUrl;
  if (c === 'recipes' && /^aff\d{1,2}$/.test(f)) return (data.affiliateProducts || [])[Number(f.slice(3))]?.imageUrl;
  if (c === 'recipes' && /^step\d{1,2}$/.test(f)) return (data.steps || [])[Number(f.slice(4))]?.image;
  if (c !== 'recipes' && f === 'image') return data.image;
  return undefined;
}
const fieldPath = (c, f) => (c !== 'recipes' ? 'image' : f === 'main' ? 'mainImageUrl' : f.startsWith('aff') ? 'affiliateProducts' : 'steps');

exports.handler = async (event) => {
  const q = event.queryStringParameters || {};
  const c = q.c || 'recipes';
  const f = q.f || 'main';
  const w = WIDTHS.includes(Number(q.w)) ? Number(q.w) : 480;
  if (!COLLECTIONS[c]) return { statusCode: 400, body: 'bad collection' };
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(String(q.id || ''))) return { statusCode: 404, body: 'not found' };
  const longCache = q.v ? cacheHeaders({ immutable: true }) : cacheHeaders({ browser: 86400, cdn: 86400 });
  const store = openStore(event, netlifyBlobs);
  try {
    const hit = await getBinary(store, outKey(c, q.id, f, q.v, w));
    if (hit && hit.buf.length) {
      return { statusCode: 200, headers: { 'Content-Type': hit.metadata.type || 'image/webp', ...longCache, 'X-CK-Cache': 'blob' }, body: hit.buf.toString('base64'), isBase64Encoded: true };
    }
    let value = await getText(store, srcKey(c, q.id, f, q.v));
    let mode = 'blob-src';
    if (!value) {
      const doc = await getWithFields(c, q.id, [fieldPath(c, f)]);
      value = doc && pickField(c, f, doc.data);
      mode = 'firestore';
      if (typeof value !== 'string' || !value) return { statusCode: 404, headers: cacheHeaders({ browser: 3600, cdn: 86400 }), body: 'not found' };
      if (value.startsWith('https://') || value.startsWith('data:')) await setText(store, srcKey(c, q.id, f, q.v), value);
    }
    if (value.startsWith('https://')) {
      return { statusCode: 302, headers: { Location: value, ...cacheHeaders({ browser: 3600, cdn: 86400 }), 'X-CK-Cache': mode }, body: '' };
    }
    const m = /^data:(image\/[a-z+.-]+);base64,(.+)$/s.exec(value);
    if (!m) return { statusCode: 404, headers: cacheHeaders({ browser: 3600, cdn: 86400 }), body: 'unsupported image' };
    let buf = Buffer.from(m[2], 'base64');
    let type = m[1];
    if (sharp) {
      buf = await sharp(buf).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: 72 }).toBuffer();
      type = 'image/webp';
      await setBinary(store, outKey(c, q.id, f, q.v, w), buf, { type });
    }
    const headers = { 'Content-Type': type, ...longCache, 'X-CK-Cache': mode };
    return { statusCode: 200, headers, body: buf.toString('base64'), isBase64Encoded: true };
  } catch (e) {
    console.error('recipe-image error:', e.message);
    return { statusCode: 502, headers: { 'Cache-Control': 'no-store' }, body: 'error' };
  }
};
