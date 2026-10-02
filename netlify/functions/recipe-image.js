// Firestore に base64 で保存された画像を、指定サイズの WebP に縮小して返す
// URL に更新日時(v)が入っているので、CDN とブラウザに1年キャッシュさせられる
const { getWithFields } = require('../lib/firestore-rest');
const { cacheHeaders } = require('../lib/http');

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
  try {
    const doc = await getWithFields(c, q.id, [fieldPath(c, f)]);
    const value = doc && pickField(c, f, doc.data);
    if (typeof value !== 'string' || !value) return { statusCode: 404, headers: cacheHeaders({ browser: 300, cdn: 3600 }), body: 'not found' };
    if (value.startsWith('https://')) {
      return { statusCode: 302, headers: { Location: value, ...cacheHeaders({ browser: 3600, cdn: 86400 }) }, body: '' };
    }
    const m = /^data:(image\/[a-z+.-]+);base64,(.+)$/s.exec(value);
    if (!m) return { statusCode: 404, body: 'unsupported image' };
    let buf = Buffer.from(m[2], 'base64');
    let type = m[1];
    if (sharp) {
      buf = await sharp(buf).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: 72 }).toBuffer();
      type = 'image/webp';
    }
    const headers = { 'Content-Type': type, ...(q.v ? cacheHeaders({ immutable: true }) : cacheHeaders({ browser: 86400, cdn: 86400 })) };
    return { statusCode: 200, headers, body: buf.toString('base64'), isBase64Encoded: true };
  } catch (e) {
    console.error('recipe-image error:', e.message);
    return { statusCode: 502, headers: { 'Cache-Control': 'no-store' }, body: 'error' };
  }
};
