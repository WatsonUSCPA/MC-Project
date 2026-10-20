// サービスアカウントで Firestore REST API に書き込むための最小ヘルパー（firebase-admin 不要）
// 認証情報は環境変数 FIREBASE_SERVICE_ACCOUNT_JSON（Netlify の環境変数に設定。リポジトリには置かない）
const crypto = require('crypto');

let cached = null; // { token, exp }

function loadServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const sa = JSON.parse(raw);
    return sa.client_email && sa.private_key ? sa : null;
  } catch {
    return null;
  }
}

const b64url = (buf) => Buffer.from(buf).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');

async function getAccessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  if (cached && cached.exp - 60 > now) return cached.token;
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const signature = b64url(crypto.createSign('RSA-SHA256').update(`${header}.${claim}`).sign(sa.private_key));
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${header}.${claim}.${signature}`,
    }),
  });
  if (!res.ok) throw new Error(`token ${res.status}`);
  const data = await res.json();
  cached = { token: data.access_token, exp: now + (data.expires_in || 3600) };
  return cached.token;
}

// 既存ドキュメントの数値フィールドを +n する（ドキュメントが無ければ何もしない）
async function incrementField(collection, id, field, n = 1) {
  const sa = loadServiceAccount();
  if (!sa) return { ok: false, reason: 'not-configured' };
  const projectId = process.env.FIREBASE_PROJECT_ID || sa.project_id || 'link-manager-f4ea8';
  const token = await getAccessToken(sa);
  const name = `projects/${projectId}/databases/(default)/documents/${collection}/${id}`;
  const res = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:commit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      writes: [{
        transform: { document: name, fieldTransforms: [{ fieldPath: field, increment: { integerValue: String(n) } }] },
        currentDocument: { exists: true },
      }],
    }),
  });
  if (res.status === 404 || res.status === 400 || res.status === 409) return { ok: false, reason: 'not-found' };
  if (!res.ok) throw new Error(`commit ${res.status}`);
  return { ok: true };
}

module.exports = { incrementField, isConfigured: () => Boolean(loadServiceAccount()) };
