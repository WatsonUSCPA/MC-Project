// Firestore REST API（公開読み取り）用の小さなヘルパー
// フィールドを絞って（mask / select）取得できるので、画像(base64)を含む重いフィールドを避けられる
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'link-manager-f4ea8';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const TIMEOUT_MS = 8000;

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Firestore ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// Firestore の値 → 普通の JS 値
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
const docId = (name) => String(name || '').split('/').pop();

// コレクション全体を、指定フィールドだけで取得
async function listWithFields(collection, fields) {
  const body = {
    structuredQuery: {
      from: [{ collectionId: collection }],
      select: { fields: fields.map((f) => ({ fieldPath: f })) },
    },
  };
  const rows = await fetchJson(`${BASE}:runQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return (rows || [])
    .filter((r) => r.document)
    .map((r) => ({ id: docId(r.document.name), updateTime: r.document.updateTime, data: decodeFields(r.document.fields) }));
}

// 1件を指定フィールドだけで取得（fields を省略すると全フィールド）
async function getWithFields(collection, id, fields) {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(String(id || ''))) return null;
  const qs = (fields || []).map((f) => `mask.fieldPaths=${encodeURIComponent(f)}`).join('&');
  const doc = await fetchJson(`${BASE}/${collection}/${encodeURIComponent(id)}${qs ? `?${qs}` : ''}`);
  if (!doc) return null;
  return { id: docId(doc.name), updateTime: doc.updateTime, data: decodeFields(doc.fields) };
}

module.exports = { listWithFields, getWithFields, decodeFields };
