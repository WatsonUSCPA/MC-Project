// Netlify Blobs を使った「Firestore の読み取り結果」の保存場所
// - CDN キャッシュはデプロイのたびに消えるが、Blobs（サイト共通のストア）はデプロイをまたいで残る
// - Firestore が上限（429）などで読めないときも、保存済みのデータを返してサイトを止めない
// - Blobs が使えない環境（ローカル等）では null を返し、呼び出し側はそのまま Firestore を読む
// 注意: @netlify/blobs は netlify/functions/package.json にしか無く、このファイル（netlify/lib）からは解決できない。
// そのため各関数側で require したモジュールを openStore(event, blobsModule) に渡す。
let blobs = null;
try { blobs = require('@netlify/blobs'); } catch (e) { /* 関数側から渡される */ }

const STORE_NAME = 'ck-firestore-cache';

function openStore(event, blobsModule) {
  const mod = blobsModule || blobs;
  if (!mod) { console.warn('@netlify/blobs not available; no persistent cache'); return null; }
  try {
    if (event && event.blobs) mod.connectLambda(event); // Lambda 互換（exports.handler）関数での接続
    return mod.getStore(STORE_NAME);
  } catch (e) {
    console.warn('blob store unavailable:', e.message);
    return null;
  }
}

async function getJSON(store, key) {
  if (!store) return null;
  try { return await store.get(key, { type: 'json' }); } catch (e) { console.warn('blob get failed:', e.message); return null; }
}

async function setJSON(store, key, value) {
  if (!store) return;
  try { await store.setJSON(key, value); } catch (e) { console.warn('blob set failed:', e.message); }
}

async function getBinary(store, key) {
  if (!store) return null;
  try {
    const r = await store.getWithMetadata(key, { type: 'arrayBuffer' });
    return r ? { buf: Buffer.from(r.data), metadata: r.metadata || {} } : null;
  } catch (e) { console.warn('blob get failed:', e.message); return null; }
}

async function setBinary(store, key, buf, metadata) {
  if (!store) return;
  try { await store.set(key, buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), { metadata }); } catch (e) { console.warn('blob set failed:', e.message); }
}

async function getText(store, key) {
  if (!store) return null;
  try { return await store.get(key, { type: 'text' }); } catch (e) { console.warn('blob get failed:', e.message); return null; }
}

async function setText(store, key, text) {
  if (!store) return;
  try { await store.set(key, text); } catch (e) { console.warn('blob set failed:', e.message); }
}

module.exports = { openStore, getJSON, setJSON, getBinary, setBinary, getText, setText };
