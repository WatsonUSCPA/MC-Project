// Firebase ID トークン（ログイン中ユーザーの証明）をサーバー側で検証する
// 追加ライブラリ不要：Google の公開証明書で RS256 署名を検証し、iss / aud / exp を確認する
// 参考: https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_a_third-party_jwt_library
const crypto = require('crypto');

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'link-manager-f4ea8';
const CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

let certCache = { certs: null, expiresAt: 0 };

async function getGoogleCerts() {
  if (certCache.certs && Date.now() < certCache.expiresAt) return certCache.certs;
  const res = await fetch(CERTS_URL);
  if (!res.ok) throw new Error(`cert fetch failed (${res.status})`);
  const certs = await res.json();
  const maxAge = Number((/max-age=(\d+)/.exec(res.headers.get('cache-control') || '') || [])[1] || 3600);
  certCache = { certs, expiresAt: Date.now() + maxAge * 1000 };
  return certs;
}

const b64urlJson = (part) => JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));

// 成功時はトークンの中身（uid, email など）を返す。失敗時は例外
async function verifyFirebaseIdToken(idToken) {
  if (typeof idToken !== 'string' || idToken.split('.').length !== 3) {
    throw new Error('malformed token');
  }
  const [h, p, s] = idToken.split('.');
  const header = b64urlJson(h);
  const payload = b64urlJson(p);
  if (header.alg !== 'RS256' || !header.kid) throw new Error('bad token header');

  const certs = await getGoogleCerts();
  const cert = certs[header.kid];
  if (!cert) throw new Error('unknown signing key');

  const ok = crypto.verify(
    'RSA-SHA256',
    Buffer.from(`${h}.${p}`),
    crypto.createPublicKey(cert),
    Buffer.from(s, 'base64url')
  );
  if (!ok) throw new Error('bad signature');

  const now = Math.floor(Date.now() / 1000);
  const skew = 300; // 時計のずれを5分まで許容
  if (payload.aud !== FIREBASE_PROJECT_ID) throw new Error('bad audience');
  if (payload.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`) throw new Error('bad issuer');
  if (typeof payload.sub !== 'string' || !payload.sub) throw new Error('bad subject');
  if (!(payload.exp > now - skew)) throw new Error('token expired');
  if (!(payload.iat <= now + skew)) throw new Error('token issued in the future');
  if (payload.auth_time && payload.auth_time > now + skew) throw new Error('bad auth_time');

  return { uid: payload.sub, email: payload.email, emailVerified: payload.email_verified === true, claims: payload };
}

// "Authorization: Bearer <token>" ヘッダーからトークンを取り出す
function getBearerToken(headers = {}) {
  const value = headers.authorization || headers.Authorization || '';
  const m = /^Bearer\s+(.+)$/i.exec(value);
  return m ? m[1].trim() : null;
}

module.exports = { verifyFirebaseIdToken, getBearerToken };
