// 公開データ用のレスポンスヘッダー
// Netlify-CDN-Cache-Control: Netlify の CDN にキャッシュさせる（durable = 全エッジで共有）
// Cache-Control: ブラウザ側のキャッシュ
function cacheHeaders({ browser = 60, cdn = 600, swr = 86400, immutable = false } = {}) {
  return immutable
    ? {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Netlify-CDN-Cache-Control': 'public, durable, max-age=31536000, immutable',
      }
    : {
        'Cache-Control': `public, max-age=${browser}`,
        'Netlify-CDN-Cache-Control': `public, durable, s-maxage=${cdn}, stale-while-revalidate=${swr}`,
      };
}

const json = (statusCode, body, headers = {}) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  body: JSON.stringify(body),
});

module.exports = { cacheHeaders, json };
