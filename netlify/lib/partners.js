// mc-square-react/src/gallery/partners.ts と同じ定義（サーバー側用）
const PARTNERS = [
  { id: 'usanko', name: 'うさんこチャンネル', authorIds: ['lovFHr9YdbWWcBel0JWBu9kAcU52'], website: 'https://www.youtube.com/@usanko_ch' },
  { id: 'clover', name: 'クロバー株式会社', authorIds: ['3hVe8DKmhGQnxWE7DmAOREuHgJH3'], website: 'https://clover.co.jp/' },
];

const isHttpsUrl = (u) => {
  if (typeof u !== 'string' || !u.trim()) return false;
  try { return new URL(u).protocol === 'https:'; } catch { return false; }
};

function getRecipeSource(data) {
  if (!data) return null;
  const explicit = data.source && typeof data.source === 'object' ? data.source : null;
  const partner = (explicit && PARTNERS.find((p) => p.id === explicit.partner)) ||
    PARTNERS.find((p) => p.authorIds.includes(data.authorId));
  if (!partner) return null;
  const url = [explicit && explicit.url, data.youtubeUrl, data.pdfUrl, data.authorSNS && data.authorSNS.website, partner.website].find(isHttpsUrl);
  const isVideo = !!url && /youtube\.com|youtu\.be/.test(url);
  return {
    partnerId: partner.id,
    name: (explicit && typeof explicit.name === 'string' && explicit.name.trim()) || partner.name,
    url,
    linkLabel: isVideo ? '元の動画を見る' : '元のレシピページを見る',
  };
}

module.exports = { PARTNERS, getRecipeSource, isHttpsUrl };
