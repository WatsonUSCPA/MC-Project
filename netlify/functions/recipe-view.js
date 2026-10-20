// レシピの閲覧数を +1 する（POST /api/recipe-view  { id }）
// 「1人・1レシピ・1日1回」はブラウザ側（localStorage）で制御。サーバーは既存レシピの views を +1 するだけ
// Firestore のルールは recipes の書き込みを禁止したまま、サービスアカウントで書き込む
const { incrementField } = require('../lib/firestore-admin');
const { json } = require('../lib/http');

const NO_STORE = { 'Cache-Control': 'no-store' };

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' }, NO_STORE);
  let id = '';
  try {
    id = String(JSON.parse(event.body || '{}').id || '');
  } catch {
    return json(400, { error: 'Invalid JSON' }, NO_STORE);
  }
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) return json(400, { error: 'Invalid id' }, NO_STORE);
  try {
    const r = await incrementField('recipes', id, 'views', 1);
    if (!r.ok && r.reason === 'not-configured') return json(503, { counted: false, error: 'not configured' }, NO_STORE);
    if (!r.ok) return json(404, { counted: false }, NO_STORE);
    return json(200, { counted: true }, NO_STORE);
  } catch (e) {
    console.error('recipe-view error:', e.message);
    return json(502, { counted: false }, NO_STORE);
  }
};
